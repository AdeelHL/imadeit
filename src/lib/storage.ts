const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function postMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE}/storage/v1/object/public/post-media/${path}`;
}
