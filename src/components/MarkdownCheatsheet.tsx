"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "imadeit:cheatsheet:open";

type Row = {
  label: string;
  /** Snippet inserted at the cursor; <SEL> marks where the caret should land. */
  snippet: string;
  /** Visual preview of how the rendered Markdown looks. */
  preview: React.ReactNode;
};

const ROWS: Row[] = [
  { label: "Heading 1", snippet: "# <SEL>", preview: <span className="text-xl font-semibold">Heading</span> },
  { label: "Heading 2", snippet: "## <SEL>", preview: <span className="text-lg font-semibold">Subheading</span> },
  { label: "Heading 3", snippet: "### <SEL>", preview: <span className="text-base font-semibold">Smaller</span> },
  { label: "Bold", snippet: "**<SEL>**", preview: <strong>bold</strong> },
  { label: "Italic", snippet: "*<SEL>*", preview: <em>italic</em> },
  { label: "Bold + italic", snippet: "***<SEL>***", preview: <strong><em>both</em></strong> },
  { label: "Strikethrough", snippet: "~~<SEL>~~", preview: <s>removed</s> },
  { label: "Inline code", snippet: "`<SEL>`", preview: <code className="rounded bg-stone-200 px-1 text-[11px] dark:bg-stone-800">code</code> },
  { label: "Code block", snippet: "```\n<SEL>\n```", preview: <code className="rounded bg-stone-200 px-1 text-[11px] dark:bg-stone-800">{"```"}</code> },
  { label: "Quote", snippet: "> <SEL>", preview: <span className="border-l-2 border-stone-400 pl-2 italic text-stone-600 dark:text-stone-300">quote</span> },
  { label: "Bullet list", snippet: "- <SEL>", preview: <span>• item</span> },
  { label: "Numbered list", snippet: "1. <SEL>", preview: <span>1. item</span> },
  { label: "Task list", snippet: "- [ ] <SEL>", preview: <span>☐ to do</span> },
  { label: "Link", snippet: "[<SEL>](https://)", preview: <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-600 underline dark:text-brand-300">link</a> },
  { label: "Image", snippet: "![<SEL>](url)", preview: <span className="text-stone-500">🖼 image</span> },
  { label: "Horizontal rule", snippet: "\n---\n", preview: <span className="block w-full border-t border-stone-300 dark:border-stone-700" /> },
  { label: "Table", snippet: "| Col 1 | Col 2 |\n| --- | --- |\n| <SEL> | |", preview: <span className="font-mono text-[10px]">| a | b |</span> },
];

export function MarkdownCheatsheet({
  onInsert,
  triggerOpenSignal,
}: {
  /** Called when a row is clicked. The implementation should insert the
   *  raw snippet at the current cursor position; <SEL> marks the desired
   *  caret position after insertion. */
  onInsert: (snippet: string) => void;
  /** Increments when the body textarea is focused. We use this to auto-open
   *  the panel exactly once per page load (unless the user opted out). */
  triggerOpenSignal?: number;
}) {
  // null = not yet hydrated; treat as closed visually until we know the user's pref.
  const [open, setOpen] = useState<boolean | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setOpen(stored === null ? false : stored === "1");
  }, []);

  useEffect(() => {
    if (open === null) return;
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  }, [open]);

  // Auto-open once when the body gets focused, but only if the user hasn't
  // explicitly closed it before. The localStorage check above runs first.
  useEffect(() => {
    if (triggerOpenSignal == null) return;
    if (hasAutoOpened) return;
    if (open === null) return;
    if (open) {
      setHasAutoOpened(true);
      return;
    }
    // If they've never had a stored preference (it would have been false above
    // because we default to closed), still auto-open the first time.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      setOpen(true);
    }
    setHasAutoOpened(true);
    // We deliberately don't auto-open if the user previously chose to close it.
  }, [triggerOpenSignal, hasAutoOpened, open]);

  const isOpen = open === true;

  return (
    <>
      {/* Closed-state handle: small vertical tab on the right edge */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Markdown cheat sheet"
        className={
          "fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 rounded-l-md border border-r-0 border-stone-200 bg-white px-2 py-3 text-[10px] font-medium uppercase tracking-wider text-stone-600 shadow-sm transition hover:bg-stone-100 md:block dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 " +
          (isOpen ? "pointer-events-none opacity-0" : "opacity-100")
        }
        style={{ writingMode: "vertical-rl" }}
      >
        Markdown
      </button>

      {/* Sliding panel */}
      <aside
        aria-label="Markdown cheat sheet"
        aria-hidden={!isOpen}
        className={
          "fixed right-0 top-[57px] z-40 hidden h-[calc(100vh-57px)] w-72 transform border-l border-stone-200 bg-white shadow-xl transition-transform duration-300 md:block dark:border-stone-800 dark:bg-stone-900 " +
          (isOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
          <h3 className="font-serif text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Markdown cheat sheet
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Hide cheat sheet"
            className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </header>

        <p className="px-4 pt-3 text-xs text-stone-500 dark:text-stone-400">
          Click a row to drop it into the body where your cursor is.
        </p>

        <ul className="max-h-[calc(100vh-160px)] overflow-y-auto px-2 py-2">
          {ROWS.map((row) => (
            <li key={row.label}>
              <button
                type="button"
                onClick={() => onInsert(row.snippet)}
                className="block w-full rounded-md px-2 py-2 text-left transition hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    {row.label}
                  </span>
                  <span className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {row.preview}
                  </span>
                </div>
                <code className="mt-1 block whitespace-pre font-mono text-[11px] text-stone-500 dark:text-stone-500">
                  {row.snippet.replace(/<SEL>/g, "…")}
                </code>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
