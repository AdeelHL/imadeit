"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, posts, tags as tagsTable, postTags } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { parseTags, slugify } from "@/lib/slug";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "").trim();
  const coverImage = String(formData.get("cover_image") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "published");
  const status: "published" | "unlisted" | "draft" =
    rawStatus === "draft"
      ? "draft"
      : rawStatus === "unlisted"
        ? "unlisted"
        : "published";
  // Unchecked checkboxes are absent from FormData entirely.
  const commentsEnabled = formData.get("comments_enabled") !== null;

  if (!title || title.length > 120) {
    redirect("/dashboard/projects/new?error=invalid-title");
  }
  if (!bodyMd) {
    redirect("/dashboard/projects/new?error=missing-body");
  }
  if (!coverImage) {
    redirect("/dashboard/projects/new?error=missing-cover");
  }

  const baseSlug = slugify(title) || "post";
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const dup = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), eq(posts.slug, slug)))
      .limit(1);
    if (dup.length === 0) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  // Insert via Supabase JS so RLS sees the user's JWT and validates author_id = auth.uid()
  const { data: post, error: insertErr } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      slug,
      title,
      cover_image: coverImage,
      body_md: bodyMd,
      status,
      comments_enabled: commentsEnabled,
    })
    .select("id, slug")
    .single();

  if (insertErr || !post) {
    redirect(
      `/dashboard/projects/new?error=${encodeURIComponent(insertErr?.message ?? "insert-failed")}`
    );
  }

  // Tags are a curated set — only link to existing rows; ignore unknown slugs.
  const tagSlugs = parseTags(tagsRaw);
  if (tagSlugs.length > 0) {
    const matchedTags = await db
      .select()
      .from(tagsTable)
      .where(inArray(tagsTable.slug, tagSlugs));
    if (matchedTags.length > 0) {
      const { error: linkErr } = await supabase.from("post_tags").insert(
        matchedTags.map((t) => ({
          post_id: post.id,
          tag_id: t.id,
        }))
      );
      if (linkErr) {
        redirect(`/dashboard/projects/new?error=${encodeURIComponent(linkErr.message)}`);
      }
    }
  }

  // Look up author username for the post URL
  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  revalidatePath("/");
  revalidatePath(`/u/${profile.username}`);
  redirect(`/u/${profile.username}/${post.slug}`);
}
