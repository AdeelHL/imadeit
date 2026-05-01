"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addComment(
  ctx: { postId: string; username: string; slug: string },
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const body = String(formData.get("body") ?? "").trim();
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();
  const parentId = parentIdRaw || null;

  if (!body || body.length > 5000) {
    redirect(`/u/${ctx.username}/${ctx.slug}?error=invalid-comment`);
  }

  const { error } = await supabase.from("comments").insert({
    post_id: ctx.postId,
    author_id: user.id,
    parent_id: parentId,
    body,
  });

  if (error) {
    redirect(
      `/u/${ctx.username}/${ctx.slug}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/u/${ctx.username}/${ctx.slug}`);
  redirect(`/u/${ctx.username}/${ctx.slug}#comments`);
}

export async function deleteComment(
  ctx: { username: string; slug: string },
  commentId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS only permits the comment's own author to delete; rows owned by
  // others won't match and the call is a no-op.
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    redirect(
      `/u/${ctx.username}/${ctx.slug}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/u/${ctx.username}/${ctx.slug}`);
  redirect(`/u/${ctx.username}/${ctx.slug}#comments`);
}
