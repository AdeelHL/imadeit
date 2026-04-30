import Link from "next/link";

export function PostCard({
  href,
  coverUrl,
  title,
  authorName,
  viewCount,
}: {
  href: string;
  coverUrl: string;
  title: string;
  authorName?: string | null;
  viewCount?: number;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-serif text-base font-medium leading-snug text-stone-900 dark:text-stone-50">
          {title}
        </h3>
        <p className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          {authorName ? <span>@{authorName}</span> : <span />}
          {typeof viewCount === "number" ? (
            <span>
              {viewCount} view{viewCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
