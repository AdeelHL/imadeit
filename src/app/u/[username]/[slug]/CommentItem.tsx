"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CommentForm } from "./CommentForm";

export type CommentNode = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  parentId: string | null;
  isOwner: boolean;
  replies: CommentNode[];
};

export function CommentItem({
  node,
  currentUserId,
  addReply,
  remove,
  depth = 0,
}: {
  node: CommentNode;
  currentUserId: string | null;
  addReply: (formData: FormData) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this comment? Replies under it will also be removed.")) {
      return;
    }
    startTransition(() => {
      remove(node.id);
    });
  }

  return (
    <li className="space-y-3">
      <div className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
        <header className="flex items-center justify-between gap-2 text-xs">
          <Link
            href={`/u/${node.authorUsername}`}
            className="font-medium text-stone-900 hover:underline dark:text-stone-100"
          >
            {node.authorDisplayName ?? `@${node.authorUsername}`}
          </Link>
          <span className="text-stone-500 dark:text-stone-400">
            {new Date(node.createdAt).toLocaleString()}
          </span>
        </header>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-800 dark:text-stone-200">
          {node.body}
        </p>
        <footer className="mt-2 flex items-center gap-3 text-xs">
          {currentUserId && depth === 0 ? (
            <button
              type="button"
              onClick={() => setShowReply((s) => !s)}
              className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
            >
              {showReply ? "Cancel" : "Reply"}
            </button>
          ) : null}
          {node.isOwner ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          ) : null}
        </footer>
      </div>

      {showReply ? (
        <div className="ml-6">
          <CommentForm
            action={addReply}
            parentId={node.id}
            placeholder={`Reply to ${node.authorDisplayName ?? node.authorUsername}…`}
            compact
            onSubmitted={() => setShowReply(false)}
          />
        </div>
      ) : null}

      {node.replies.length > 0 ? (
        <ul className="ml-6 space-y-3 border-l border-stone-200 pl-4 dark:border-stone-800">
          {node.replies.map((r) => (
            <CommentItem
              key={r.id}
              node={r}
              currentUserId={currentUserId}
              addReply={addReply}
              remove={remove}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
