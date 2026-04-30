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
    <main className="px-6 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Profile &amp; account
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
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
              className="block text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile.bio ?? ""}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
              placeholder="Woodworker. Software dev. Photographer."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-stone-50 shadow-sm hover:bg-brand-600"
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
        className="block text-sm font-medium text-stone-700 dark:text-stone-300"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        required={required}
        className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
      />
      {hint ? (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>
      ) : null}
    </div>
  );
}
