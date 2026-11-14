import { timingSafeEqual } from "node:crypto";
import { processOutbox } from "@/lib/email/outbox";

/**
 * Retries queued or failed notification emails. Vercel Cron calls this on the
 * schedule in vercel.json, sending `Authorization: Bearer $CRON_SECRET`.
 * Emails are also sent immediately after each submission and admin action;
 * this only catches anything that failed then.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok = secret.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new Response("Unauthorized", { status: 401 });
  const result = await processOutbox(50);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
