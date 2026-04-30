"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, posts, tags as tagsTable } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { parseTags } from "@/lib/slug";

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "").trim();
  const coverImage = String(formData.get("cover_image") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const status =
    String(formData.get("status") ?? "published") === "draft"
      ? "draft"
      : "published";

  if (!title || title.length > 120) {
    redirect(`/dashboard/posts/${postId}/edit?error=invalid-title`);
  }
  if (!bodyMd) {
    redirect(`/dashboard/posts/${postId}/edit?error=missing-body`);
  }
  if (!coverImage) {
    redirect(`/dashboard/posts/${postId}/edit?error=missing-cover`);
  }

  // Update via Supabase JS so RLS validates ownership at the DB layer.
  const { error: updErr } = await supabase
    .from("posts")
    .update({
      title,
      body_md: bodyMd,
      cover_image: coverImage,
      status,
    })
    .eq("id", postId);

  if (updErr) {
    redirect(
      `/dashboard/posts/${postId}/edit?error=${encodeURIComponent(updErr.message)}`
    );
  }

  // Tag re-association: delete all existing post_tags for this post, then
  // insert the current selection. RLS gates both ops to the post owner.
  const { error: delTagsErr } = await supabase
    .from("post_tags")
    .delete()
    .eq("post_id", postId);
  if (delTagsErr) {
    redirect(
      `/dashboard/posts/${postId}/edit?error=${encodeURIComponent(delTagsErr.message)}`
    );
  }

  const tagSlugs = parseTags(tagsRaw);
  if (tagSlugs.length > 0) {
    const matchedTags = await db
      .select()
      .from(tagsTable)
      .where(inArray(tagsTable.slug, tagSlugs));
    if (matchedTags.length > 0) {
      const { error: insTagsErr } = await supabase.from("post_tags").insert(
        matchedTags.map((t) => ({
          post_id: postId,
          tag_id: t.id,
        }))
      );
      if (insTagsErr) {
        redirect(
          `/dashboard/posts/${postId}/edit?error=${encodeURIComponent(insTagsErr.message)}`
        );
      }
    }
  }

  // Look up author username + slug for redirect
  const [post] = await db
    .select({ slug: posts.slug, authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  revalidatePath("/");
  revalidatePath("/dashboard/posts");
  if (profile && post) {
    revalidatePath(`/u/${profile.username}/${post.slug}`);
    revalidatePath(`/u/${profile.username}`);
  }

  redirect(`/dashboard/posts/${postId}/edit?saved=1`);
}
