import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInWithEmail } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const sp = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-16 font-sans">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We&apos;ll email you a magic link. No password needed.
        </p>

        {sp.sent ? (
          <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            Magic link sent to <strong>{sp.email}</strong>. Check your inbox
            (and spam folder) and click the link to sign in.
          </div>
        ) : (
          <form action={signInWithEmail} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Send magic link
            </button>

            {sp.error ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {sp.error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </main>
  );
}
