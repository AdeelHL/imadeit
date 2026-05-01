import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, viewerHash } from "@/lib/viewerHash";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let postId: string | null = null;
  try {
    const body = await request.json();
    postId = typeof body?.postId === "string" ? body.postId : null;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!postId) {
    return NextResponse.json({ error: "missing postId" }, { status: 400 });
  }

  const ip = clientIp(request.headers);
  const userAgent = request.headers.get("user-agent") ?? "";
  const hash = viewerHash({ ip, userAgent });

  const supabase = await createClient();

  // record_post_view is SECURITY DEFINER and silently no-ops on conflict, so
  // calling repeatedly within the same UTC day for the same viewer is safe.
  // It also returns early for unpublished posts.
  const { error } = await supabase.rpc("record_post_view", {
    p_post_id: postId,
    p_viewer_hash: hash,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
