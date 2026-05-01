import Link from "next/link";
import { db } from "@/lib/db/client";
import { posts, profiles, tags as tagsTable } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { ProjectCard } from "@/components/ProjectCard";
import { postMediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
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
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.createdAt))
      .limit(60),
    db
      .select({ slug: tagsTable.slug, name: tagsTable.name })
      .from(tagsTable)
      .orderBy(asc(tagsTable.name)),
  ]);

  return (
    <main className="min-h-[calc(100vh-57px)]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-brand-50 to-stone-50 px-6 py-16 dark:border-stone-800 dark:from-stone-900 dark:to-stone-950">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl dark:text-stone-50">
            Show what you{" "}
            <span className="italic text-brand-600 dark:text-brand-300">
              made
            </span>
            .
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-700 dark:text-stone-300">
            A home for makers — woodworkers, software devs, illustrators,
            ceramicists, anyone who builds things. Post the piece. Tell the
            story.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/projects/new"
              className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-semibold text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              Share something you made
            </Link>
            <Link
              href="#feed"
              className="rounded-md border border-stone-300 bg-white/60 px-5 py-2.5 text-sm font-medium text-stone-900 backdrop-blur hover:bg-white dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100 dark:hover:bg-stone-900"
            >
              Browse the feed
            </Link>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section
        id="feed"
        className="sticky top-[57px] z-20 border-b border-stone-200 bg-stone-50/90 px-6 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90"
      >
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto whitespace-nowrap">
          <Link
            href="/"
            className="rounded-full border border-stone-900 bg-stone-900 px-3 py-1 text-xs font-medium text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
          >
            All
          </Link>
          {allTags.map((t) => (
            <Link
              key={t.slug}
              href={`/t/${t.slug}`}
              className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600"
            >
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center text-stone-600 dark:border-stone-700 dark:text-stone-400">
              No projects yet.{" "}
              <Link href="/dashboard/projects/new" className="font-medium text-brand-600 underline dark:text-brand-300">
                Be the first to publish one
              </Link>
              .
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
