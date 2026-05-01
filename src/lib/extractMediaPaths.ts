const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PUBLIC_PREFIX = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/post-media/`
  : "";

/**
 * Pull every `post-media` storage path referenced by a Markdown body. Used at
 * post-delete time to garbage-collect inline images alongside the cover.
 *
 * Matches both `![alt](url)` images and `[label](url)` links pointing at the
 * bucket — handling links covers users who paste the URL directly.
 */
export function extractMediaPaths(markdown: string): string[] {
  if (!PUBLIC_PREFIX) return [];
  const paths = new Set<string>();
  const re = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const m of markdown.matchAll(re)) {
    const url = m[1];
    if (url.startsWith(PUBLIC_PREFIX)) {
      const path = decodeURIComponent(url.slice(PUBLIC_PREFIX.length));
      if (path) paths.add(path);
    }
  }
  return Array.from(paths);
}
