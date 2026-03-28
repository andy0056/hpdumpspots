const fs = require("fs");

function parseEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

const localEnv = parseEnvFile(".env.local");
function pickEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key] || localEnv[key];
    if (value) return value;
  }
  return "";
}

const env = {
  DB_URL: pickEnv(
    "DB_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
  ),
  DB_KEY: pickEnv(
    "DB_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
  ),
  LOCK_INSPECT_ENV:
    process.env.LOCK_INSPECT_ENV ??
    localEnv.LOCK_INSPECT_ENV ??
    "false",
  TURNSTILE_SITE_KEY: pickEnv("TURNSTILE_SITE_KEY"),
};

const lockEnabled = String(env.LOCK_INSPECT_ENV).toLowerCase() === "true";

fs.writeFileSync(
  "config.js",
  [
    `const DB_URL = ${JSON.stringify(env.DB_URL)};`,
    `const DB_KEY = ${JSON.stringify(env.DB_KEY)};`,
    `const LOCK_INSPECT_ENV = ${lockEnabled};`,
    `const TURNSTILE_SITE_KEY = ${JSON.stringify(env.TURNSTILE_SITE_KEY)};`,
    "",
  ].join("\n"),
);

console.log(
  "config.js generated, URL:",
  env.DB_URL ? "SET" : "MISSING",
  "| KEY:",
  env.DB_KEY ? "SET" : "MISSING",
  "| LOCK:",
  lockEnabled ? "ON" : "OFF",
  "| TURNSTILE:",
  env.TURNSTILE_SITE_KEY ? "SET" : "OFF",
);
