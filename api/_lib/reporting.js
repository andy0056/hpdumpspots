const crypto = require("crypto");
const {
  ALLOWED_CATEGORIES,
  ALLOWED_DISTRICTS,
  ALLOWED_SEVERITIES,
  ALLOWED_SITE_TYPES,
  MAX_IMAGE_DIMENSION,
  MAX_LOCATION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHOTOS,
  MAX_TEXT_LENGTH,
  MAX_UPLOAD_BYTES,
  PUBLIC_BUCKET,
  QUARANTINE_BUCKET,
} = require("./constants");
const { detectImageType, parseImageDimensions } = require("./images");
const { isPointInHimachal } = require("./himachal");
const {
  extensionForMime,
  jaccardSimilarity,
  maskReporterName,
  normalizeFreeText,
  normalizeLocation,
  normalizeWhitespace,
  toCleanStringArray,
} = require("./security");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function genReportId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `DS-${date}-${time}-${random}`;
}

function isAllowedGoogleMapsLink(rawUrl) {
  if (!rawUrl) return "";
  let url;
  try {
    url = new URL(rawUrl);
  } catch (error) {
    throw new Error("invalid_gmaps_link");
  }
  const hostname = url.hostname.toLowerCase();
  const allowed =
    hostname === "maps.app.goo.gl" ||
    hostname === "goo.gl" ||
    hostname.endsWith(".google.com") ||
    hostname === "google.com";
  if (url.protocol !== "https:" || !allowed) {
    throw new Error("invalid_gmaps_link");
  }
  return url.toString();
}

function validateReportPayload(input) {
  const reporter = normalizeWhitespace(input.reporter);
  const district = normalizeWhitespace(input.district);
  const area = normalizeLocation(input.area);
  const specific = normalizeLocation(input.specific || "");
  const notes = normalizeWhitespace(input.notes || "");
  const type = toCleanStringArray(input.type, ALLOWED_SITE_TYPES);
  const cats = toCleanStringArray(input.cats, ALLOWED_CATEGORIES);
  const sev = toCleanStringArray(input.sev, ALLOWED_SEVERITIES);
  const lat = Number(input.lat);
  const lng = Number(input.lng);

  assert(reporter && reporter.length <= MAX_NAME_LENGTH, "invalid_reporter");
  assert(ALLOWED_DISTRICTS.includes(district), "invalid_district");
  assert(area && area.length <= MAX_LOCATION_LENGTH, "invalid_area");
  assert(specific.length <= MAX_LOCATION_LENGTH, "invalid_specific");
  assert(notes.length <= MAX_TEXT_LENGTH, "invalid_notes");
  assert(Number.isFinite(lat) && Number.isFinite(lng), "invalid_coordinates");

  return {
    reporter,
    public_reporter: maskReporterName(reporter),
    state: "Himachal Pradesh",
    district,
    area,
    specific,
    notes,
    type,
    cats,
    sev,
    lat,
    lng,
    digipin: normalizeWhitespace(input.digipin || ""),
    pluscode: normalizeWhitespace(input.pluscode || ""),
    gmaps_link: isAllowedGoogleMapsLink(input.gmaps_link || ""),
  };
}

async function logSubmissionEvent(supabase, event) {
  await supabase.from("submission_events").insert({
    action: event.action,
    outcome: event.outcome,
    submitter_hash: event.submitterHash,
    ip_hash: event.ipHash,
    ua_hash: event.uaHash,
    details: event.details || {},
  });
}

async function countSubmissionEvents(supabase, filters) {
  let query = supabase
    .from("submission_events")
    .select("id", { count: "exact", head: true });

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.ipHash) query = query.eq("ip_hash", filters.ipHash);
  if (filters.submitterHash) query = query.eq("submitter_hash", filters.submitterHash);
  if (filters.since) query = query.gte("created_at", filters.since);
  if (Array.isArray(filters.outcomes) && filters.outcomes.length) {
    query = query.in("outcome", filters.outcomes);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function loadUploadArtifacts(supabase, uploads) {
  assert(Array.isArray(uploads) && uploads.length > 0, "missing_uploads");
  assert(uploads.length <= MAX_PHOTOS, "too_many_photos");

  const seenPaths = new Set();
  const artifacts = [];

  for (let index = 0; index < uploads.length; index += 1) {
    const item = uploads[index] || {};
    const path = normalizeWhitespace(item.path);
    assert(path && !seenPaths.has(path), "invalid_upload_path");
    seenPaths.add(path);

    const { data, error } = await supabase.storage.from(QUARANTINE_BUCKET).download(path);
    if (error) throw new Error("upload_missing");

    const buffer = Buffer.from(await data.arrayBuffer());
    assert(buffer.length > 0 && buffer.length <= MAX_UPLOAD_BYTES, "oversized_upload");

    const mimeType = detectImageType(buffer);
    assert(["image/png", "image/jpeg", "image/webp"].includes(mimeType), "invalid_image_type");

    const dimensions = parseImageDimensions(buffer, mimeType);
    assert(dimensions.width > 0 && dimensions.height > 0, "invalid_image_dimensions");
    assert(
      dimensions.width <= MAX_IMAGE_DIMENSION &&
        dimensions.height <= MAX_IMAGE_DIMENSION,
      "oversized_image_dimensions",
    );

    artifacts.push({
      position: index + 1,
      path,
      buffer,
      mimeType,
      sizeBytes: buffer.length,
      width: dimensions.width,
      height: dimensions.height,
      sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
      clientFlags: Array.isArray(item.clientFlags)
        ? item.clientFlags.map((flag) => normalizeWhitespace(flag)).filter(Boolean)
        : [],
    });
  }

  return artifacts;
}

async function buildPhotoRows(artifacts, publishedUploads) {
  return artifacts.map((artifact) => {
    const published = publishedUploads.get(artifact.position) || {};
    return {
      position: artifact.position,
      url: published.url || null,
      quarantine_path: artifact.path,
      public_path: published.publicPath || null,
      mime_type: artifact.mimeType,
      size_bytes: artifact.sizeBytes,
      sha256: artifact.sha256,
    };
  });
}

async function publishArtifacts(supabase, reportId, artifacts) {
  const published = new Map();
  const quarantinePaths = [];

  for (const artifact of artifacts) {
    const extension = extensionForMime(artifact.mimeType);
    const publicPath = `${reportId}/${artifact.position}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(publicPath, artifact.buffer, {
        contentType: artifact.mimeType,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(PUBLIC_BUCKET)
      .getPublicUrl(publicPath);

    published.set(artifact.position, {
      publicPath,
      url: publicUrlData.publicUrl,
    });
    quarantinePaths.push(artifact.path);
  }

  if (quarantinePaths.length) {
    await supabase.storage.from(QUARANTINE_BUCKET).remove(quarantinePaths);
  }

  return published;
}

async function removeQuarantineArtifacts(supabase, photoRows) {
  const paths = photoRows
    .map((row) => normalizeWhitespace(row.quarantine_path))
    .filter(Boolean);
  if (!paths.length) return;
  await supabase.storage.from(QUARANTINE_BUCKET).remove(paths);
}

async function getRecentDistrictReports(supabase, district, sinceIso) {
  const { data, error } = await supabase
    .from("reports")
    .select("id, area, specific, notes, cats, lat, lng, status, created_at")
    .eq("district", district)
    .neq("status", "rejected")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function assessRiskFlags(supabase, report, artifacts) {
  const flags = new Set();

  if (!isPointInHimachal(report.lat, report.lng)) {
    flags.add("outside_himachal");
  }
  if (artifacts.some((artifact) => artifact.clientFlags.length > 0)) {
    flags.add("client_photo_flags");
  }

  for (const artifact of artifacts) {
    const { count, error } = await supabase
      .from("report_photos")
      .select("id", { count: "exact", head: true })
      .eq("sha256", artifact.sha256);
    if (error) throw error;
    if ((count || 0) > 0) flags.add("reused_photo_hash");
  }

  const recent24h = await getRecentDistrictReports(
    supabase,
    report.district,
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  const newTextFingerprint = [
    report.area,
    report.specific,
    report.notes,
    report.cats.join(" "),
  ].join(" ");

  for (const existing of recent24h) {
    const existingFingerprint = [
      existing.area,
      existing.specific,
      existing.notes,
      ...(existing.cats || []),
    ].join(" ");
    const similarity = jaccardSimilarity(newTextFingerprint, existingFingerprint);
    if (similarity >= 0.82) {
      flags.add("duplicate_text_same_district");
      break;
    }
  }

  const recent12h = recent24h.filter((item) => {
    return (
      new Date(item.created_at).getTime() >=
      Date.now() - 12 * 60 * 60 * 1000
    );
  });
  const roundedLat = report.lat.toFixed(3);
  const roundedLng = report.lng.toFixed(3);
  for (const existing of recent12h) {
    const sameLocation =
      Number(existing.lat).toFixed(3) === roundedLat &&
      Number(existing.lng).toFixed(3) === roundedLng;
    const overlappingCategory =
      (existing.cats || []).some((category) => report.cats.includes(category));
    if (sameLocation && overlappingCategory) {
      flags.add("duplicate_location_category");
      break;
    }
  }

  const riskFlags = [...flags];
  return {
    riskFlags,
    riskScore: riskFlags.length * 15,
    status: riskFlags.length ? "pending" : "published",
  };
}

module.exports = {
  assessRiskFlags,
  buildPhotoRows,
  countSubmissionEvents,
  genReportId,
  loadUploadArtifacts,
  logSubmissionEvent,
  publishArtifacts,
  removeQuarantineArtifacts,
  validateReportPayload,
};
