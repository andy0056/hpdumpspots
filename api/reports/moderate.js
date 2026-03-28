const { env, getServiceClient } = require("../_lib/config");
const { getJsonBody, methodNotAllowed, sendJson } = require("../_lib/http");
const {
  buildPhotoRows,
  loadUploadArtifacts,
  publishArtifacts,
  removeQuarantineArtifacts,
} = require("../_lib/reporting");
const { normalizeWhitespace } = require("../_lib/security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const secret = req.headers["x-moderation-secret"];
  if (!env.moderationSecret || secret !== env.moderationSecret) {
    return sendJson(res, 401, { ok: false, error: "unauthorized" });
  }

  try {
    const body = await getJsonBody(req);
    const reportId = normalizeWhitespace(body.reportId);
    const action = normalizeWhitespace(body.action).toLowerCase();
    const reviewer = normalizeWhitespace(body.reviewer || "dashboard");
    const reason = normalizeWhitespace(body.reason || "");
    if (!reportId || !["approve", "reject"].includes(action)) {
      return sendJson(res, 400, { ok: false, error: "invalid_request" });
    }

    const supabase = getServiceClient();
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();
    if (reportError || !report) {
      return sendJson(res, 404, { ok: false, error: "report_not_found" });
    }

    const { data: photos, error: photoError } = await supabase
      .from("report_photos")
      .select("*")
      .eq("report_id", reportId)
      .order("position", { ascending: true });
    if (photoError) throw photoError;

    if (action === "approve") {
      const uploads = (photos || []).map((photo) => ({
        path: photo.quarantine_path,
        clientFlags: [],
      }));
      const artifacts = await loadUploadArtifacts(supabase, uploads);
      const published = await publishArtifacts(supabase, reportId, artifacts);
      const updatedRows = await buildPhotoRows(artifacts, published);

      for (const row of updatedRows) {
        const { error } = await supabase
          .from("report_photos")
          .update({
            url: row.url,
            public_path: row.public_path,
          })
          .eq("report_id", reportId)
          .eq("position", row.position);
        if (error) throw error;
      }

      const { error } = await supabase
        .from("reports")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      if (error) throw error;
    } else {
      await removeQuarantineArtifacts(supabase, photos || []);
      const { error } = await supabase
        .from("reports")
        .update({ status: "rejected" })
        .eq("id", reportId);
      if (error) throw error;
    }

    const { error: moderationError } = await supabase
      .from("moderation_actions")
      .insert({
        report_id: reportId,
        action,
        reason: reason || null,
        reviewer,
      });
    if (moderationError) throw moderationError;

    return sendJson(res, 200, { ok: true, reportId, action });
  } catch (error) {
    console.error("[api/reports/moderate]", error);
    return sendJson(res, 500, { ok: false, error: "server_error" });
  }
};
