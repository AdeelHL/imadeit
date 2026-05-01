"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteProject } from "./actions";
import { postMediaUrl } from "@/lib/storage";

export function ProjectRow({
  post,
  authorUsername,
}: {
  post: {
    id: string;
    slug: string;
    title: string;
    coverImage: string;
    status: string;
    viewCount: number;
    createdAt: Date;
  };
  authorUsername: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (
      !confirm(
        `Delete "${post.title}"? This permanently removes the project, its tags, and any comments.`
      )
    ) {
      return;
    }
    startTransition(() => {
      deleteProject(post.id);
    });
  }

  return (
    <li className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={postMediaUrl(post.coverImage)}
        alt=""
        className="h-16 w-16 shrink-0 rounded-md object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${authorUsername}/${post.slug}`}
            className="truncate font-medium text-stone-900 hover:underline dark:text-stone-50"
          >
            {post.title}
          </Link>
          {post.status === "draft" ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              Draft
            </span>
          ) : post.status === "unlisted" ? (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-700 dark:bg-stone-800 dark:text-stone-200">
              Unlisted
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {new Date(post.createdAt).toLocaleDateString()} · {post.viewCount}{" "}
          view{post.viewCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/dashboard/projects/${post.id}/edit`}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-stone-900 dark:text-red-300 dark:hover:bg-red-950"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
