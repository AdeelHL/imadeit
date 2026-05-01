import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { posts, profiles, postTags, tags } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Markdown } from "@/components/Markdown";
import { postMediaUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { ViewBeacon } from "@/components/ViewBeacon";
import { Comments } from "./Comments";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      coverImage: posts.coverImage,
      bodyMd: posts.bodyMd,
      status: posts.status,
      commentsEnabled: posts.commentsEnabled,
      createdAt: posts.createdAt,
      viewCount: posts.viewCount,
      authorId: posts.authorId,
      authorUsername: profiles.username,
      authorDisplayName: profiles.displayName,
      authorBio: profiles.bio,
    })
    .from(posts)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .where(and(eq(profiles.username, username), eq(posts.slug, slug)))
    .limit(1);

  if (!row) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Drafts are author-only; published + unlisted are accessible by direct URL.
  if (row.status === "draft" && row.authorId !== user?.id) {
    notFound();
  }

  const tagRows = await db
    .select({ slug: tags.slug, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, row.id));

  return (
    <main className="min-h-[calc(100vh-57px)] px-6 pb-20">
      {/* Cover image full-bleed */}
      <div className="relative -mx-6 mb-10 h-[44vh] min-h-[280px] max-h-[520px] overflow-hidden bg-stone-200 dark:bg-stone-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={postMediaUrl(row.coverImage)}
          alt={row.title}
          className="h-full w-full object-cover"
        />
      </div>

      <article className="mx-auto max-w-2xl">
        <Link
          href={`/u/${username}`}
          className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
        >
          ← @{username}
        </Link>

        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
          {row.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-500 dark:text-stone-400">
          <Link
            href={`/u/${username}`}
            className="font-medium text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-stone-50"
          >
            {row.authorDisplayName ?? `@${username}`}
          </Link>
          <span aria-hidden>·</span>
          <span>{new Date(row.createdAt).toLocaleDateString()}</span>
          <span aria-hidden>·</span>
          <span>
            {row.viewCount} view{row.viewCount === 1 ? "" : "s"}
          </span>
          {row.status === "unlisted" ? (
            <span
              title="Hidden from feeds. Anyone with the link can view."
              className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200"
            >
              Unlisted
            </span>
          ) : row.status === "draft" ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              Draft
            </span>
          ) : null}
        </div>

        {tagRows.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tagRows.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/t/${t.slug}`}
                  className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-10">
          <Markdown>{row.bodyMd}</Markdown>
        </div>

        <Comments
          postId={row.id}
          username={username}
          slug={slug}
          commentsEnabled={row.commentsEnabled}
        />
      </article>

      <ViewBeacon
        postId={row.id}
        enabled={row.status === "published" && row.authorId !== user?.id}
      />
    </main>
  );
}
