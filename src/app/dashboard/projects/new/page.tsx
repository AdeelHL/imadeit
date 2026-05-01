import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { tags as tagsTable } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { ProjectForm } from "@/components/ProjectForm";
import { createProject } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allTags = await db
    .select({ slug: tagsTable.slug, name: tagsTable.name })
    .from(tagsTable)
    .orderBy(asc(tagsTable.name));

  const sp = await searchParams;

  return (
    <main className="min-h-[calc(100vh-57px)] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Share what you made
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Cover image, the story behind it, and the categories it fits.
        </p>

        {sp.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {sp.error}
          </p>
        ) : null}

        <div className="mt-8">
          <ProjectForm
            mode="create"
            userId={user.id}
            availableTags={allTags}
            action={createProject}
          />
        </div>
      </div>
    </main>
  );
}
