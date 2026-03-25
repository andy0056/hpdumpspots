const fs = require("fs");
const url = process.env.DB_URL || "";
const key = process.env.DB_KEY || "";
const lock = process.env.LOCK_INSPECT_ENV || "false";
fs.writeFileSync(
  "config.js",
  `const DB_URL = "${url}";\nconst DB_KEY = "${key}";\nconst LOCK_INSPECT_ENV = ${lock};\n`,
);
console.log(
  "config.js generated, URL:",
  url ? "SET" : "MISSING",
  "| KEY:",
  key ? "SET" : "MISSING",
);
