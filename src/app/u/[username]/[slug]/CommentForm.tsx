"use client";

import { useRef, useState, useTransition } from "react";

export function CommentForm({
  action,
  parentId,
  placeholder = "Write a comment…",
  compact = false,
  onSubmitted,
}: {
  action: (formData: FormData) => Promise<void>;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
  onSubmitted?: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleSubmit(formData: FormData) {
    if (!body.trim()) return;
    startTransition(async () => {
      await action(formData);
      setBody("");
      formRef.current?.reset();
      onSubmitted?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      {parentId ? (
        <input type="hidden" name="parent_id" value={parentId} />
      ) : null}
      <textarea
        name="body"
        rows={compact ? 2 : 3}
        required
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-50 hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          {pending ? "Posting…" : parentId ? "Reply" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
