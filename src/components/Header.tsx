import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signOut } from "@/app/login/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const [profile] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur dark:border-stone-800/80 dark:bg-stone-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="group flex items-center gap-2 text-stone-900 dark:text-stone-100"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 font-serif text-sm font-bold text-stone-50 transition group-hover:rotate-[-4deg]"
          >
            i
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">
            IMadeIt
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link
                href="/new"
                className="hidden rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-stone-50 hover:bg-stone-800 sm:inline-block dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                + New post
              </Link>
              <Link
                href="/dashboard"
                className="text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-50"
              >
                {username ? `@${username}` : "dashboard"}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
