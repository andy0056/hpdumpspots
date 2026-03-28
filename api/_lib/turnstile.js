const { env } = require("./config");

async function verifyTurnstileToken(token, ip) {
  if (!env.turnstileSecretKey) return false;
  if (!token) return false;

  const body = new URLSearchParams({
    secret: env.turnstileSecretKey,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  if (!response.ok) return false;
  const data = await response.json();
  return !!data.success;
}

module.exports = {
  verifyTurnstileToken,
};
