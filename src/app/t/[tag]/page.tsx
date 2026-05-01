import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import {
  posts,
  profiles,
  postTags,
  tags as tagsTable,
} from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { ProjectCard } from "@/components/ProjectCard";
import { postMediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function TagFeedPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  const [tagRow] = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.slug, tag))
    .limit(1);
  if (!tagRow) notFound();

  const [rows, allTags] = await Promise.all([
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        coverImage: posts.coverImage,
        viewCount: posts.viewCount,
        authorUsername: profiles.username,
      })
      .from(posts)
      .innerJoin(profiles, eq(profiles.id, posts.authorId))
      .innerJoin(postTags, eq(postTags.postId, posts.id))
      .where(and(eq(postTags.tagId, tagRow.id), eq(posts.status, "published")))
      .orderBy(desc(posts.createdAt))
      .limit(60),
    db
      .select({ slug: tagsTable.slug, name: tagsTable.name })
      .from(tagsTable)
      .orderBy(asc(tagsTable.name)),
  ]);

  return (
    <main className="min-h-[calc(100vh-57px)]">
      {/* Filter row */}
      <section className="sticky top-[57px] z-20 border-b border-stone-200 bg-stone-50/90 px-6 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto whitespace-nowrap">
          <Link
            href="/"
            className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600"
          >
            All
          </Link>
          {allTags.map((t) => {
            const active = t.slug === tag;
            return (
              <Link
                key={t.slug}
                href={`/t/${t.slug}`}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (active
                    ? "border-stone-900 bg-stone-900 font-medium text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600")
                }
              >
                {t.name}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {tagRow.name}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {rows.length} post{rows.length === 1 ? "" : "s"}
          </p>

          {rows.length === 0 ? (
            <p className="mt-12 text-stone-500 dark:text-stone-400">
              Nothing here yet.
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {rows.map((p) => (
                <li key={p.id}>
                  <ProjectCard
                    href={`/u/${p.authorUsername}/${p.slug}`}
                    coverUrl={postMediaUrl(p.coverImage)}
                    title={p.title}
                    authorName={p.authorUsername}
                    viewCount={p.viewCount}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
