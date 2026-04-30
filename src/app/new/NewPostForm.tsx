"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { TagPicker, type TagOption } from "@/components/TagChips";
import { createPost } from "./actions";

export function NewPostForm({
  userId,
  availableTags,
}: {
  userId: string;
  availableTags: TagOption[];
}) {
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineFileRef = useRef<HTMLInputElement | null>(null);

  async function uploadFile(file: File): Promise<{ path: string; url: string } | null> {
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
        // Restore cursor after the inserted markdown on next tick
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
      createPost(formData);
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
        <TagPicker options={availableTags} max={5} />
      </div>

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
          {pending ? "Publishing…" : "Publish"}
        </button>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Your post will be public.
        </span>
      </div>
    </form>
  );
}
