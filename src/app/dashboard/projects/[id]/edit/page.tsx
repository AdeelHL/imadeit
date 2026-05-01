import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import {
  posts,
  profiles,
  postTags,
  tags as tagsTable,
} from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { ProjectForm } from "@/components/ProjectForm";
import { postMediaUrl } from "@/lib/storage";
import { updateProject } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.authorId, user.id)))
    .limit(1);

  if (!post) notFound();

  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const [allTags, postTagRows] = await Promise.all([
    db
      .select({ slug: tagsTable.slug, name: tagsTable.name })
      .from(tagsTable)
      .orderBy(asc(tagsTable.name)),
    db
      .select({ slug: tagsTable.slug })
      .from(postTags)
      .innerJoin(tagsTable, eq(tagsTable.id, postTags.tagId))
      .where(eq(postTags.postId, post.id)),
  ]);

  const action = updateProject.bind(null, post.id);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Edit project
          </h1>
          {profile ? (
            <Link
              href={`/u/${profile.username}/${post.slug}`}
              className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
            >
              View →
            </Link>
          ) : null}
        </div>

        {sp.saved ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            Changes saved.
          </p>
        ) : null}
        {sp.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {sp.error}
          </p>
        ) : null}

        <div className="mt-8">
          <ProjectForm
            mode="edit"
            userId={user.id}
            availableTags={allTags}
            initial={{
              title: post.title,
              bodyMd: post.bodyMd,
              coverPath: post.coverImage,
              coverUrl: postMediaUrl(post.coverImage),
              status:
                post.status === "draft"
                  ? "draft"
                  : post.status === "unlisted"
                    ? "unlisted"
                    : "published",
              commentsEnabled: post.commentsEnabled,
              tagSlugs: postTagRows.map((r) => r.slug),
            }}
            action={action}
          />
        </div>
      </div>
    </main>
  );
}
