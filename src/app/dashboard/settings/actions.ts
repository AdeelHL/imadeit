"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
    redirect("/dashboard/settings?error=invalid-username");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  redirect("/dashboard/settings?saved=1");
}
