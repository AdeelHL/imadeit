"use client";

import { useState } from "react";

export type TagOption = { slug: string; name: string };

export function TagPicker({
  options,
  initial = [],
  max = 5,
  name = "tags",
}: {
  options: TagOption[];
  initial?: string[];
  max?: number;
  name?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < max) {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={Array.from(selected).join(",")} />
      <div className="flex flex-wrap gap-2">
        {options.map((t) => {
          const active = selected.has(t.slug);
          return (
            <button
              type="button"
              key={t.slug}
              onClick={() => toggle(t.slug)}
              aria-pressed={active}
              className={
                "rounded-full border px-3 py-1 text-sm transition " +
                (active
                  ? "border-brand-500 bg-brand-500 text-stone-50"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600")
              }
            >
              {t.name}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        Pick up to {max}. {selected.size} selected.
      </p>
    </div>
  );
}
