import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Bot protection for the public submission form.
 *
 * Always on: a hidden honeypot field, a minimum time to fill the form, and a
 * per-IP rate limit kept in the database. Cloudflare Turnstile is added when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are both set.
 */

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY ?? "";
export const isTurnstileEnabled = Boolean(turnstileSiteKey && turnstileSecret);

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** One-way hash of the IP, so raw addresses are never stored. */
export function fingerprint(ip: string) {
  const salt = process.env.SUBMISSION_HASH_SALT || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "maa";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!isTurnstileEnabled) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: turnstileSecret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
