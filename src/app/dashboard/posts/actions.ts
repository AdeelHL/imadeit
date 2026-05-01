"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { extractMediaPaths } from "@/lib/extractMediaPaths";

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the cover + body so we can purge storage objects after the row
  // delete cascades. Filter on author_id so an attacker can't probe rows
  // that aren't theirs (RLS would also stop the read, but belt + braces).
  const [post] = await db
    .select({ coverImage: posts.coverImage, bodyMd: posts.bodyMd })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, user.id)))
    .limit(1);

  if (!post) {
    redirect("/dashboard/posts?error=not-found");
  }

  // RLS enforces author_id = auth.uid() on the delete itself.
  const { error: delErr } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (delErr) {
    redirect(`/dashboard/posts?error=${encodeURIComponent(delErr.message)}`);
  }

  // Best-effort storage cleanup: cover image + every inline body image whose
  // URL points at our `post-media` bucket. Storage RLS scopes deletes to
  // objects under the user's UID folder, so the user can only ever remove
  // their own files via this path.
  const pathsToRemove = new Set<string>();
  if (post.coverImage) pathsToRemove.add(post.coverImage);
  for (const p of extractMediaPaths(post.bodyMd ?? "")) {
    pathsToRemove.add(p);
  }
  if (pathsToRemove.size > 0) {
    await supabase.storage
      .from("post-media")
      .remove(Array.from(pathsToRemove));
    // We don't surface storage errors to the user — the post row is already
    // gone, and the orphan files are bounded and recoverable later.
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  redirect("/dashboard/posts?deleted=1");
}
