import { redirect } from "next/navigation";

export default function LegacyNewRedirect() {
  redirect("/dashboard/projects/new");
}
