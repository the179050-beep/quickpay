import { randomBytes } from "crypto";

let _secret: string | null = null;

export function getJwtSecret(): string {
  if (_secret) return _secret;

  const envPw = process.env["DASH_PASSWORD"];
  if (envPw && envPw.length >= 8) {
    _secret = envPw;
    return _secret;
  }

  const generated = randomBytes(32).toString("hex");
  console.warn(
    [
      "⚠️  DASH_PASSWORD is not set (or is shorter than 8 chars).",
      `   A random dashboard password has been generated for this session: ${generated.slice(0, 12)}`,
      "   Set the DASH_PASSWORD environment variable to use a fixed password.",
    ].join("\n"),
  );
  _secret = generated;
  process.env["DASH_PASSWORD"] = generated;
  return _secret;
}
