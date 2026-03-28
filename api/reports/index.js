const { getServiceClient } = require("../_lib/config");
const { getJsonBody, methodNotAllowed, sendJson } = require("../_lib/http");
const {
  assessRiskFlags,
  buildPhotoRows,
  countSubmissionEvents,
  genReportId,
  loadUploadArtifacts,
  logSubmissionEvent,
  publishArtifacts,
  validateReportPayload,
} = require("../_lib/reporting");
const {
  getClientIp,
  getUserAgent,
  hashValue,
  normalizeWhitespace,
} = require("../_lib/security");
const { verifyTurnstileToken } = require("../_lib/turnstile");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  let supabase;
  let submitterHash = "";
  let ipHash = "";
  let uaHash = "";

  try {
    const body = await getJsonBody(req);
    const submitterFingerprint = normalizeWhitespace(body.submitterFingerprint);
    const uploads = Array.isArray(body.uploads) ? body.uploads : [];
    const challengeToken = normalizeWhitespace(body.challengeToken || "");
    const payload = validateReportPayload(body.report || {});

    if (!submitterFingerprint) {
      return sendJson(res, 400, { ok: false, error: "missing_fingerprint" });
    }

    const ip = getClientIp(req);
    ipHash = hashValue(`ip:${ip}`);
    uaHash = hashValue(`ua:${getUserAgent(req)}`);
    submitterHash = hashValue(`submitter:${submitterFingerprint}`);
    supabase = getServiceClient();

    const count15m = await countSubmissionEvents(supabase, {
      action: "submit_report",
      ipHash,
      outcomes: ["published", "pending", "allow_after_challenge"],
      since: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    });
    const count24h = await countSubmissionEvents(supabase, {
      action: "submit_report",
      ipHash,
      outcomes: ["published", "pending", "allow_after_challenge"],
      since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    if (count24h >= 12) {
      await logSubmissionEvent(supabase, {
        action: "submit_report",
        outcome: "blocked_daily_limit",
        submitterHash,
        ipHash,
        uaHash,
        details: { district: payload.district },
      });
      return sendJson(res, 429, {
        ok: false,
        error: "daily_limit_reached",
        message: "Too many reports from this network today.",
      });
    }

    if (count15m >= 3) {
      const challengePassed = await verifyTurnstileToken(challengeToken, ip);
      if (!challengePassed) {
        await logSubmissionEvent(supabase, {
          action: "submit_report",
          outcome: "challenge_required",
          submitterHash,
          ipHash,
          uaHash,
          details: { district: payload.district },
        });
        return sendJson(res, 429, {
          ok: false,
          error: "challenge_required",
          challengeRequired: true,
          message: "Verification required before more reports.",
        });
      }
    }

    const artifacts = await loadUploadArtifacts(supabase, uploads);
    const risk = await assessRiskFlags(supabase, payload, artifacts);
    const reportId = genReportId();
    const published = risk.status === "published"
      ? await publishArtifacts(supabase, reportId, artifacts)
      : new Map();
    const photoRows = await buildPhotoRows(artifacts, published);

    const { error: reportError } = await supabase.from("reports").insert({
      id: reportId,
      reporter: payload.reporter,
      public_reporter: payload.public_reporter,
      state: payload.state,
      district: payload.district,
      area: payload.area,
      specific: payload.specific,
      type: payload.type,
      cats: payload.cats,
      sev: payload.sev,
      notes: payload.notes || null,
      lat: payload.lat,
      lng: payload.lng,
      digipin: payload.digipin || null,
      pluscode: payload.pluscode || null,
      gmaps_link: payload.gmaps_link || null,
      ts: new Date().toISOString(),
      status: risk.status,
      risk_score: risk.riskScore,
      risk_flags: risk.riskFlags,
      submitter_hash: submitterHash,
      ip_hash: ipHash,
      ua_hash: uaHash,
      created_at: new Date().toISOString(),
      published_at: risk.status === "published" ? new Date().toISOString() : null,
    });
    if (reportError) throw reportError;

    const { error: photoError } = await supabase.from("report_photos").insert(
      photoRows.map((row) => ({
        report_id: reportId,
        url: row.url,
        quarantine_path: row.quarantine_path,
        public_path: row.public_path,
        mime_type: row.mime_type,
        size_bytes: row.size_bytes,
        sha256: row.sha256,
        position: row.position,
      })),
    );
    if (photoError) throw photoError;

    await logSubmissionEvent(supabase, {
      action: "submit_report",
      outcome: risk.status,
      submitterHash,
      ipHash,
      uaHash,
      details: {
        district: payload.district,
        reportId,
        riskFlags: risk.riskFlags,
      },
    });

    return sendJson(res, 200, {
      ok: true,
      id: reportId,
      status: risk.status,
      riskFlags: risk.riskFlags,
    });
  } catch (error) {
    console.error("[api/reports]", error);
    if (supabase && submitterHash && ipHash && uaHash) {
      try {
        await logSubmissionEvent(supabase, {
          action: "submit_report",
          outcome: "server_error",
          submitterHash,
          ipHash,
          uaHash,
          details: { message: String(error.message || error) },
        });
      } catch (logError) {
        console.error("[api/reports] event log failed", logError);
      }
    }
    const known = new Set([
      "invalid_reporter",
      "invalid_district",
      "invalid_area",
      "invalid_specific",
      "invalid_notes",
      "invalid_coordinates",
      "invalid_gmaps_link",
      "missing_uploads",
      "too_many_photos",
      "invalid_upload_path",
      "upload_missing",
      "oversized_upload",
      "invalid_image_type",
      "invalid_image_dimensions",
      "oversized_image_dimensions",
      "missing_fingerprint",
    ]);
    if (known.has(error.message)) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }
    return sendJson(res, 500, { ok: false, error: "server_error" });
  }
};
