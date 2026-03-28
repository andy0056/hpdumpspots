const crypto = require("crypto");
const { env } = require("./config");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "0.0.0.0";
}

function getUserAgent(req) {
  return String(req.headers["user-agent"] || "");
}

function hashValue(value) {
  const secret =
    env.abuseHashSalt || env.supabaseServiceRoleKey || "onehimachal-dev-salt";
  return crypto
    .createHmac("sha256", secret)
    .update(String(value || ""))
    .digest("hex");
}

function maskReporterName(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  const chars = Array.from(clean);
  if (!chars.length) return "An******";
  if (chars.length === 1) return chars[0] + "*";
  return chars.slice(0, 2).join("") + "*".repeat(Math.min(6, chars.length - 2));
}

function normalizeWhitespace(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeFreeText(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocation(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toCleanStringArray(input, allowedValues) {
  if (!Array.isArray(input)) return [];
  const allowed = new Set(allowedValues);
  return [...new Set(input.map((item) => normalizeWhitespace(item)).filter((item) => allowed.has(item)))];
}

function escapeForLike(value) {
  return String(value || "").replace(/[%_]/g, "\\$&");
}

function tokenize(value) {
  return new Set(normalizeFreeText(value).split(" ").filter(Boolean));
}

function jaccardSimilarity(left, right) {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size && !b.size) return 1;
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / new Set([...a, ...b]).size;
}

function extensionForMime(mimeType) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

module.exports = {
  escapeForLike,
  extensionForMime,
  getClientIp,
  getUserAgent,
  hashValue,
  jaccardSimilarity,
  maskReporterName,
  normalizeFreeText,
  normalizeLocation,
  normalizeWhitespace,
  toCleanStringArray,
};
