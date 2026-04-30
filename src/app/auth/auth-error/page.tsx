export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-16 font-sans">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-red-700 dark:text-red-400">
          Sign-in failed
        </h1>
        <p className="mt-3 text-zinc-700 dark:text-zinc-300">
          {sp.reason ?? "Unknown error."}
        </p>
        <a
          href="/login"
          className="mt-6 inline-block text-sm text-zinc-900 underline dark:text-zinc-50"
        >
          Try again
        </a>
      </div>
    </main>
  );
}
