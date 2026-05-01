import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "IMadeIt — show off what you made",
  description:
    "A home for makers. Post your woodworking, software, ceramics, illustration — anything you made — with the story behind it.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; displayName: string | null } | null = null;
  if (user) {
    const [row] = await db
      .select({
        username: profiles.username,
        displayName: profiles.displayName,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    profile = row ?? null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <Header
          isSignedIn={Boolean(user)}
          username={profile?.username ?? null}
        />
        {profile ? (
          <div className="md:flex">
            <Sidebar user={profile} />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
