"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS enforces author_id = auth.uid(); a row owned by someone else simply
  // won't be matched, returning a no-op rather than an error.
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    redirect(`/dashboard/posts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  redirect("/dashboard/posts?deleted=1");
}
