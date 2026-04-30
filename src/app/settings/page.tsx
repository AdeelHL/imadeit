import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <p className="text-red-600">
          No profile row found for this user. Did the auth.users → profiles
          trigger run?
        </p>
      </main>
    );
  }

  const sp = await searchParams;

  return (
    <main className="min-h-[calc(100vh-57px)] bg-zinc-50 dark:bg-black px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile settings
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-mono">{user.email}</span>
        </p>

        <form action={updateProfile} className="mt-8 space-y-5">
          <Field
            label="Username"
            name="username"
            defaultValue={profile.username}
            hint="Letters, numbers, underscores. 2–30 chars. Used in your public URL."
            required
          />
          <Field
            label="Display name"
            name="display_name"
            defaultValue={profile.displayName ?? ""}
            hint="Shown on your profile and posts. Optional."
          />
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile.bio ?? ""}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Woodworker. Software dev. Photographer."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save changes
            </button>
            {sp.saved ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                Saved
              </span>
            ) : null}
            {sp.error ? (
              <span className="text-sm text-red-600 dark:text-red-400">
                {sp.error === "invalid-username"
                  ? "Username must be 2–30 characters of letters/numbers/underscores."
                  : sp.error}
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        required={required}
        className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
      {hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}
