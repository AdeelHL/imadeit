import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

// Curated, admin-managed taxonomy. Order here is irrelevant; ordering on the
// UI is alphabetical by name unless we want to feature specific ones.
const TAGS = [
  ["woodworking", "Woodworking"],
  ["metalwork", "Metalwork"],
  ["3d-printing", "3D Printing"],
  ["electronics", "Electronics"],
  ["software", "Software"],
  ["web-design", "Web Design"],
  ["gamedev", "Game Dev"],
  ["illustration", "Illustration"],
  ["painting", "Painting"],
  ["photography", "Photography"],
  ["ceramics", "Ceramics"],
  ["jewelry", "Jewelry"],
  ["leatherwork", "Leatherwork"],
  ["textiles", "Textiles"],
  ["writing", "Writing"],
  ["music", "Music"],
  ["cooking", "Cooking"],
  ["baking", "Baking"],
];

// Upsert curated set
for (const [slug, name] of TAGS) {
  await sql`
    INSERT INTO public.tags (slug, name)
    VALUES (${slug}, ${name})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  `;
}

// Remove tags that are no longer in the curated list AND have no posts.
// (We never auto-delete tags with posts attached; that would orphan content.)
const curatedSlugs = TAGS.map(([s]) => s);
await sql`
  DELETE FROM public.tags
  WHERE slug NOT IN ${sql(curatedSlugs)}
    AND id NOT IN (SELECT DISTINCT tag_id FROM public.post_tags)
`;

const rows = await sql`SELECT slug, name FROM public.tags ORDER BY name`;
console.log("tags in DB:");
for (const r of rows) console.log(`  ${r.slug.padEnd(15)} ${r.name}`);

await sql.end();
