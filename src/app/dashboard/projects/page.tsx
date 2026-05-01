import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { posts, profiles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProjectRow } from "./ProjectRow";

export const dynamic = "force-dynamic";

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const myPosts = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      coverImage: posts.coverImage,
      status: posts.status,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.authorId, user.id))
    .orderBy(desc(posts.createdAt));

  const sp = await searchParams;
  const totalViews = myPosts.reduce((sum, p) => sum + p.viewCount, 0);
  const drafts = myPosts.filter((p) => p.status === "draft").length;
  const published = myPosts.length - drafts;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              My projects
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {myPosts.length} total · {published} published · {drafts} draft
              · {totalViews} view{totalViews === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            + New project
          </Link>
        </div>

        {sp.deleted ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            Project deleted.
          </p>
        ) : null}
        {sp.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {sp.error}
          </p>
        ) : null}

        {myPosts.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-stone-300 p-12 text-center text-stone-600 dark:border-stone-700 dark:text-stone-400">
            You haven&apos;t shared any projects yet.{" "}
            <Link href="/dashboard/projects/new" className="font-medium text-brand-600 underline dark:text-brand-300">
              Share your first one
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {myPosts.map((p) => (
              <ProjectRow
                key={p.id}
                post={p}
                authorUsername={profile?.username ?? ""}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
