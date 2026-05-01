import Link from "next/link";
import { db } from "@/lib/db/client";
import { comments, profiles } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "./CommentForm";
import { CommentItem, type CommentNode } from "./CommentItem";
import { addComment, deleteComment } from "./comments-actions";

export async function Comments({
  postId,
  username,
  slug,
  commentsEnabled,
}: {
  postId: string;
  username: string;
  slug: string;
  commentsEnabled: boolean;
}) {
  // When the author has comments off, hide the whole section. Existing
  // comments are still in the DB and reappear if comments are re-enabled.
  if (!commentsEnabled) {
    return (
      <section
        id="comments"
        className="mt-16 border-t border-stone-200 pt-10 dark:border-stone-800"
      >
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Comments
        </h2>
        <p className="mt-4 rounded-md border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
          Comments are turned off for this post.
        </p>
      </section>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      authorId: comments.authorId,
      authorUsername: profiles.username,
      authorDisplayName: profiles.displayName,
    })
    .from(comments)
    .innerJoin(profiles, eq(profiles.id, comments.authorId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  // Build a tree: top-level (parent_id null) sorted newest-first; replies
  // attached to their parent and sorted oldest-first within each thread.
  const byParent = new Map<string | null, typeof rows>();
  for (const r of rows) {
    const key = r.parentId ?? null;
    const arr = byParent.get(key) ?? [];
    arr.push(r);
    byParent.set(key, arr);
  }

  const toNode = (r: (typeof rows)[number]): CommentNode => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    authorId: r.authorId,
    authorUsername: r.authorUsername,
    authorDisplayName: r.authorDisplayName,
    parentId: r.parentId,
    isOwner: currentUserId === r.authorId,
    replies: (byParent.get(r.id) ?? []).map(toNode),
  });

  const topLevel = (byParent.get(null) ?? [])
    .map(toNode)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Bind context into the actions so the client components only deal with FormData / id
  const submitAction = addComment.bind(null, { postId, username, slug });
  const removeAction = deleteComment.bind(null, { username, slug });

  return (
    <section
      id="comments"
      className="mt-16 border-t border-stone-200 pt-10 dark:border-stone-800"
    >
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        {rows.length} comment{rows.length === 1 ? "" : "s"}
      </h2>

      <div className="mt-6">
        {currentUserId ? (
          <CommentForm action={submitAction} />
        ) : (
          <p className="rounded-md border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
            <Link
              href="/login"
              className="font-medium text-brand-600 underline dark:text-brand-300"
            >
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        )}
      </div>

      {topLevel.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              currentUserId={currentUserId}
              addReply={submitAction}
              remove={removeAction}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-stone-500 dark:text-stone-400">
          Be the first to say something.
        </p>
      )}
    </section>
  );
}
