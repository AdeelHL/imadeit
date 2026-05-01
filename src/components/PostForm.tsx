"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { TagPicker, type TagOption } from "@/components/TagChips";

export type PostFormInitial = {
  title: string;
  bodyMd: string;
  coverPath: string;
  coverUrl: string;
  status: "published" | "unlisted" | "draft";
  commentsEnabled: boolean;
  tagSlugs: string[];
};

export function PostForm({
  userId,
  availableTags,
  mode,
  initial,
  action,
  submitLabel,
}: {
  userId: string;
  availableTags: TagOption[];
  mode: "create" | "edit";
  initial?: PostFormInitial;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}) {
  const [coverPath, setCoverPath] = useState<string | null>(
    initial?.coverPath ?? null
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.coverUrl ?? null
  );
  const [coverUploading, setCoverUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const [body, setBody] = useState(initial?.bodyMd ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineFileRef = useRef<HTMLInputElement | null>(null);

  async function uploadFile(
    file: File
  ): Promise<{ path: string; url: string } | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("post-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setError(upErr.message);
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("post-media").getPublicUrl(path);
    return { path, url: publicUrl };
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCoverUploading(true);
    try {
      const r = await uploadFile(file);
      if (!r) return;
      setCoverPath(r.path);
      setCoverPreview(r.url);
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBodyUploading(true);
    try {
      const r = await uploadFile(file);
      if (!r) return;
      const ta = bodyRef.current;
      const insert = `\n\n![${file.name.replace(/\.[^.]+$/, "")}](${r.url})\n\n`;
      if (ta) {
        const start = ta.selectionStart ?? body.length;
        const end = ta.selectionEnd ?? body.length;
        const next = body.slice(0, start) + insert + body.slice(end);
        setBody(next);
        requestAnimationFrame(() => {
          ta.focus();
          const pos = start + insert.length;
          ta.setSelectionRange(pos, pos);
        });
      } else {
        setBody((b) => b + insert);
      }
    } finally {
      setBodyUploading(false);
      if (inlineFileRef.current) inlineFileRef.current.value = "";
    }
  }

  function handleSubmit(formData: FormData) {
    if (!coverPath) {
      setError("Please upload a cover image first.");
      return;
    }
    formData.set("cover_image", coverPath);
    formData.set("body_md", body);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-7">
      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Cover image
        </label>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          The hero image people see in the feed and at the top of your post.
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleCoverChange}
          disabled={coverUploading || pending}
          className="mt-2 block w-full text-sm text-stone-700 file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-50 hover:file:bg-stone-800 dark:text-stone-300 dark:file:bg-stone-100 dark:file:text-stone-900"
        />
        {coverUploading ? (
          <p className="mt-1 text-xs text-stone-500">Uploading…</p>
        ) : null}
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt="Cover preview"
            className="mt-3 max-h-72 w-full rounded-md border border-stone-200 object-cover dark:border-stone-800"
          />
        ) : null}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={initial?.title ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          placeholder="Walnut & maple cutting board"
        />
      </div>

      {/* Body + inline image */}
      <div>
        <div className="flex items-end justify-between">
          <label
            htmlFor="body_md"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Body
          </label>
          <button
            type="button"
            onClick={() => inlineFileRef.current?.click()}
            disabled={bodyUploading || pending}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {bodyUploading ? "Uploading…" : "+ Add image to post"}
          </button>
          <input
            ref={inlineFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleInlineImage}
          />
        </div>
        <textarea
          ref={bodyRef}
          id="body_md"
          rows={14}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          placeholder={"# How I built this\n\nTell the story behind your work — materials, process, what you'd do differently…"}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Markdown supported. Headings (#), **bold**, *italic*, lists, links,
          code. The image button uploads and pastes a Markdown image where your
          cursor is.
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Categories
        </label>
        <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
          Help people find your work in the right feed.
        </p>
        <TagPicker
          options={availableTags}
          initial={initial?.tagSlugs ?? []}
          max={5}
        />
      </div>

      {/* Visibility + comments toggles (edit mode only) */}
      {mode === "edit" ? (
        <>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              Visibility
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initial?.status ?? "published"}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
            >
              <option value="published">
                Published — anyone can view, appears in feeds
              </option>
              <option value="unlisted">
                Unlisted — only people with the link can view
              </option>
              <option value="draft">Draft — only you can view</option>
            </select>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Unlisted posts are hidden from all feeds, but anyone with the
              direct URL can open them.
            </p>
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="comments_enabled"
                value="1"
                defaultChecked={initial?.commentsEnabled ?? true}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-500 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900"
              />
              <span>
                <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Allow comments
                </span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">
                  Existing comments stay visible if you turn this off — only
                  new ones are blocked.
                </span>
              </span>
            </label>
          </div>
        </>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || coverUploading || bodyUploading || !coverPath}
          className="rounded-md bg-brand-500 px-5 py-2 text-sm font-semibold text-stone-50 shadow-sm hover:bg-brand-600 disabled:opacity-50"
        >
          {pending
            ? mode === "edit"
              ? "Saving…"
              : "Publishing…"
            : (submitLabel ?? (mode === "edit" ? "Save changes" : "Publish"))}
        </button>
        {mode === "create" ? (
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Your post will be public.
          </span>
        ) : null}
      </div>
    </form>
  );
}
