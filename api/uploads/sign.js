const crypto = require("crypto");
const {
  MAX_PHOTOS,
  MAX_UPLOAD_BYTES,
  QUARANTINE_BUCKET,
} = require("../_lib/constants");
const { env, getServiceClient } = require("../_lib/config");
const { getJsonBody, methodNotAllowed, sendJson } = require("../_lib/http");
const { countSubmissionEvents, logSubmissionEvent } = require("../_lib/reporting");
const {
  extensionForMime,
  getClientIp,
  getUserAgent,
  hashValue,
  normalizeWhitespace,
} = require("../_lib/security");
const { verifyTurnstileToken } = require("../_lib/turnstile");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const body = await getJsonBody(req);
    const files = Array.isArray(body.files) ? body.files : [];
    const submitterFingerprint = normalizeWhitespace(body.submitterFingerprint);
    const challengeToken = normalizeWhitespace(body.challengeToken || "");

    if (!submitterFingerprint) {
      return sendJson(res, 400, { ok: false, error: "missing_fingerprint" });
    }
    if (!files.length || files.length > MAX_PHOTOS) {
      return sendJson(res, 400, { ok: false, error: "invalid_file_count" });
    }

    const ip = getClientIp(req);
    const ipHash = hashValue(`ip:${ip}`);
    const uaHash = hashValue(`ua:${getUserAgent(req)}`);
    const submitterHash = hashValue(`submitter:${submitterFingerprint}`);
    const supabase = getServiceClient();

    const hourlyCount = await countSubmissionEvents(supabase, {
      action: "sign_upload",
      ipHash,
      since: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });

    let challengePassed = false;
    if (hourlyCount >= 20) {
      challengePassed = await verifyTurnstileToken(challengeToken, ip);
      if (!challengePassed) {
        await logSubmissionEvent(supabase, {
          action: "sign_upload",
          outcome: "challenge_required",
          submitterHash,
          ipHash,
          uaHash,
          details: { fileCount: files.length },
        });
        return sendJson(res, 429, {
          ok: false,
          error: "challenge_required",
          challengeRequired: !!env.turnstileSecretKey,
          message: env.turnstileSecretKey
            ? "Verification required before more uploads."
            : "Upload limit reached.",
        });
      }
    }

    const prefix = `${submitterHash.slice(0, 12)}/${Date.now()}-${crypto.randomUUID()}`;
    const uploads = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index] || {};
      const contentType = normalizeWhitespace(file.contentType);
      const sizeBytes = Number(file.sizeBytes);
      if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
        return sendJson(res, 400, { ok: false, error: "invalid_file_type" });
      }
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
        return sendJson(res, 400, { ok: false, error: "invalid_file_size" });
      }

      const path = `${prefix}/${index + 1}.${extensionForMime(contentType)}`;
      const { data, error } = await supabase.storage
        .from(QUARANTINE_BUCKET)
        .createSignedUploadUrl(path);
      if (error) throw error;

      uploads.push({
        path,
        token: data.token,
        contentType,
        sizeBytes,
      });
    }

    await logSubmissionEvent(supabase, {
      action: "sign_upload",
      outcome: challengePassed ? "allow_after_challenge" : "allow",
      submitterHash,
      ipHash,
      uaHash,
      details: { fileCount: uploads.length },
    });

    return sendJson(res, 200, {
      ok: true,
      bucket: QUARANTINE_BUCKET,
      uploads,
    });
  } catch (error) {
    console.error("[api/uploads/sign]", error);
    return sendJson(res, 500, { ok: false, error: "server_error" });
  }
};
