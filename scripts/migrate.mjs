import { config } from "dotenv";
config({ path: ".env.local" });
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const MIGRATIONS_DIR = "drizzle";

const sql = postgres(DATABASE_URL, { max: 1, prepare: false });

await sql`
  CREATE TABLE IF NOT EXISTS public._migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

const applied = new Set(
  (await sql`SELECT name FROM public._migrations`).map((r) => r.name)
);

const files = (await readdir(MIGRATIONS_DIR))
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip  ${file}`);
    continue;
  }
  const body = await readFile(join(MIGRATIONS_DIR, file), "utf8");
  const statements = body
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`apply ${file}  (${statements.length} statements)`);
  await sql.begin(async (tx) => {
    for (const stmt of statements) {
      await tx.unsafe(stmt);
    }
    await tx`INSERT INTO public._migrations (name) VALUES (${file})`;
  });
}

await sql.end();
console.log("done");
