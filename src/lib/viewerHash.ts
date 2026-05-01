import { createHash } from "node:crypto";

/**
 * Compute a daily-rotating, non-reversible viewer hash from the request.
 * Same viewer (IP + user agent) on the same UTC day → same hash → upserts to
 * post_views collide on the (post_id, viewer_hash, viewed_on) PK and dedup.
 * Next UTC day → different hash → counts as a new view.
 */
export function viewerHash(req: { ip?: string; userAgent?: string }): string {
  const ip = req.ip ?? "0.0.0.0";
  const ua = req.userAgent ?? "";
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return createHash("sha256")
    .update(`${ip}\x00${ua}\x00${day}`)
    .digest("hex");
}

export function clientIp(headers: Headers): string {
  // x-forwarded-for can contain a list; take the first entry
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "0.0.0.0";
}
