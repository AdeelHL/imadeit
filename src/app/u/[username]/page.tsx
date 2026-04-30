import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { posts, profiles } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { PostCard } from "@/components/PostCard";
import { postMediaUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const rows = isOwner
    ? await db
        .select()
        .from(posts)
        .where(eq(posts.authorId, profile.id))
        .orderBy(desc(posts.createdAt))
    : await db
        .select()
        .from(posts)
        .where(and(eq(posts.authorId, profile.id), eq(posts.status, "published")))
        .orderBy(desc(posts.createdAt));

  return (
    <main className="min-h-[calc(100vh-57px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {profile.displayName ?? `@${profile.username}`}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            @{profile.username}
          </p>
          {profile.bio ? (
            <p className="mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
              {profile.bio}
            </p>
          ) : null}
        </header>

        {rows.length === 0 ? (
          <p className="mt-12 text-zinc-500 dark:text-zinc-400">
            No posts yet.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((p) => (
              <li key={p.id}>
                <PostCard
                  href={`/u/${profile.username}/${p.slug}`}
                  coverUrl={postMediaUrl(p.coverImage)}
                  title={p.title}
                  authorName={null}
                  viewCount={p.viewCount}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
