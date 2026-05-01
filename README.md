# IMadeIt

A showcase platform for makers — woodworkers, software developers, illustrators, ceramicists, and anyone else who builds things. Each *project* pairs an image-led cover with a long-form Markdown write-up of the work behind it: the materials, the process, the decisions, the lessons. A creator's full set of projects becomes their portfolio.

The interface borrows from two different worlds: an Instagram-style grid for browsing visual work at a glance, and a Medium-style detail view for the story behind each piece.

---

## Status

Functional, not yet deployed. Auth, project CRUD, comments, view tracking, and a creator dashboard are all working locally. Production deploy and richer per-project styling are next.

---

## Features

### Creators
- **Magic-link sign-in.** No passwords. New users get a profile row provisioned automatically by a database trigger on first sign-in.
- **Creator dashboard.** Persistent left sidebar visible site-wide once signed in, with quick access to *My projects*, *New project*, and *Profile & account*.
- **Project creation.** Cover image upload, Markdown body, inline images that can be uploaded mid-write and inserted at the cursor as Markdown image syntax.
- **Project visibility states.** Each project is **Published** (in feeds), **Unlisted** (link-only, hidden from feeds), or **Draft** (author-only). Choosable on create and edit.
- **Comments toggle per project.** Authors can disable comments on a project; the database-level RLS policy refuses inserts for disabled projects, and the existing comment list is hidden in the UI without losing data.
- **Markdown cheat-sheet panel.** A slide-in reference on the right of the editor with click-to-insert snippets for headings, bold, italics, links, code, tables, etc. Selection-aware: wraps your current selection if you have one.
- **Edit + delete projects.** Edit form is pre-filled (including current tag selection); delete cascades to comments, tags, views, and best-effort-removes the cover plus any inline images from Storage.
- **Profile editing.** Username, display name, and bio.

### Browsers
- **Public feeds.** A grid of the latest published projects, plus per-category feeds (`/t/woodworking`, etc.) and per-user portfolio pages (`/u/[username]`).
- **Curated categories.** A controlled taxonomy of 18 maker-relevant categories (Woodworking, Software, Ceramics, Photography, etc.) — locked at the database level so the tag list stays clean.
- **Project detail view.** Full-bleed cover hero with a typeset long-form body rendering Markdown, including inline images, lists, code, headings, GFM tables.
- **Threaded comments.** Single level of nesting. Authenticated users post their own; comment authors can delete theirs.
- **View counter.** Daily-deduplicated, computed from a server-side hash of IP + user agent + UTC date so the same viewer doesn't keep bumping the count.

---

## Tech stack

| Layer        | Choice                                 | Notes                                                      |
| ------------ | -------------------------------------- | ---------------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + React 19     | Server Components by default; Server Actions for mutations |
| Language     | TypeScript                             | Strict mode                                                |
| Database     | Postgres on Supabase                   | Free tier                                                  |
| Auth         | Supabase Auth (`@supabase/ssr`)        | Magic link via the built-in email provider                 |
| ORM          | Drizzle ORM                            | TypeScript schema as source of truth                       |
| Storage      | Supabase Storage (`post-media` bucket) | Public reads, RLS-gated writes                             |
| Styling      | Tailwind CSS v4 + shadcn/ui            | Custom warm palette + serif headings                       |
| Markdown     | `react-markdown` + `remark-gfm`        | GitHub-flavored Markdown                                   |
| Typography   | Geist (body), Fraunces (headings)      | Variable serif via `next/font/google`                      |
| Hosting plan | Vercel                                 | Not yet deployed                                           |

---

## Architecture notes

A few decisions worth surfacing for anyone reading the code:

- **Authorization lives in the database, not the app.** Every public table has Row Level Security enabled, with policies that constrain reads (published / unlisted only; drafts author-only) and writes to the row's owner. The Next.js layer doesn't have to remember "is this user allowed to do X" — Postgres refuses unauthorized writes regardless of how they reach it.

- **Comment-disabling is enforced at the policy layer.** When an author turns comments off, the comments insert policy refuses new rows for that project. Even a hostile client crafting requests against the Supabase REST endpoint can't bypass it.

- **View tracking is daily-deduplicated and forgery-resistant.** Clients can never insert into `post_views` directly (no policy permits it). Instead they call a `SECURITY DEFINER` Postgres function `record_post_view(post_id, viewer_hash)` which inserts with `ON CONFLICT DO NOTHING` against a `(post_id, viewer_hash, viewed_on)` primary key. A trigger on the resulting insert increments a denormalized `posts.view_count`.

- **Tags are admin-curated, not user-generated.** The original "any authenticated user can insert tags" policy was deliberately revoked; only the seed script (running with the service role) can add new tags. Users select from existing chips on the project form, and the form just sends slugs — unknown slugs are silently ignored server-side.

- **Storage uploads are gated by path.** The `post-media` bucket policy permits authenticated inserts only when the object key starts with the user's UID — `${auth.uid()}/...`. The browser uploads directly to Supabase Storage with the user's JWT; no proxy server, no service-role key on the client.

- **Schema is owned by Drizzle.** `src/lib/db/schema.ts` is the source of truth. SQL migrations are generated by `drizzle-kit generate` and applied by an idempotent runner in `scripts/migrate.mjs` that tracks applied files in a `_migrations` ledger table. RLS policies, triggers, and storage setup ride alongside in hand-written follow-up migrations.

- **User-facing model is "project"; database model is "post".** The UI, URLs, and component names all use *project* (matches portfolio language). The underlying SQL keeps `posts`, `post_tags`, `post_views`, and `post-media` to avoid renaming dozens of constraints and policies for cosmetic gain.

---

## Local development

### Prerequisites

- Node 20+
- A free Supabase project (https://supabase.com)

### Setup

```bash
git clone https://github.com/AdeelHL/imadeit.git
cd imadeit
npm install
```

Create `.env.local` with credentials from your Supabase project (Settings → API and Settings → Database → Connection string):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
DATABASE_URL=postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:6543/postgres
```

> Note: special characters in the database password (`!`, `&`, `^`, `$`, etc.) must be URL-encoded.

Apply migrations and seed the curated tag list:

```bash
npm run db:migrate
npm run db:seed
```

Run the dev server:

```bash
npm run dev
```

Visit http://localhost:3000.

### Available scripts

| Script                | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start the Next.js dev server with Turbopack            |
| `npm run build`       | Production build                                       |
| `npm run lint`        | ESLint                                                 |
| `npm run db:generate` | Generate a new SQL migration from `schema.ts` diff     |
| `npm run db:migrate`  | Apply pending migrations                               |
| `npm run db:seed`     | Seed/refresh the curated tag taxonomy                  |
| `npm run db:studio`   | Open Drizzle Studio (visual DB browser)                |

---

## Project layout

```
src/
  app/
    page.tsx                          # public feed (latest projects)
    login/                            # magic-link sign-in flow
    auth/callback/                    # OTP callback handler
    new/                              # 307 → /dashboard/projects/new (legacy)
    settings/                         # 307 → /dashboard/settings (legacy)
    dashboard/
      page.tsx                        # 307 → /dashboard/projects
      projects/
        page.tsx                      # creator's project list
        actions.ts                    # deleteProject server action
        ProjectRow.tsx                # row UI with Edit / Delete
        new/                          # /dashboard/projects/new — create form
        [id]/edit/                    # /dashboard/projects/<id>/edit — edit form
      settings/                       # /dashboard/settings — profile editor
    t/[tag]/                          # category-filtered feed
    u/[username]/                     # user portfolio page
    u/[username]/[slug]/              # project detail page (+ comments + view beacon)
    api/views/route.ts                # POST endpoint that calls record_post_view RPC
  components/
    Header.tsx, Sidebar.tsx
    ProjectCard.tsx, ProjectForm.tsx
    Markdown.tsx, MarkdownCheatsheet.tsx
    TagChips.tsx, ViewBeacon.tsx
  lib/
    db/
      schema.ts                       # Drizzle schema (single source of truth)
      client.ts                       # postgres-js + Drizzle instance
    supabase/
      server.ts                       # createClient() for Server Components
      client.ts                       # createClient() for Client Components
      middleware.ts                   # session refresh helper
    slug.ts, storage.ts               # small utilities
    viewerHash.ts                     # SHA-256 of IP + UA + UTC date
    extractMediaPaths.ts              # finds bucket URLs in Markdown for cleanup
  proxy.ts                            # Next.js proxy: refreshes Supabase session

drizzle/                              # generated + hand-written SQL migrations
scripts/                              # migrate runner, tag seeder
```

---

## Roadmap

Near term:
- [ ] Per-project styling (custom background and text colors, then fonts and font sizes — JSONB-backed so adding more knobs doesn't need migrations)
- [ ] Per-day view chart on the author's own project pages

Later:
- [ ] OAuth sign-in (Google, GitHub)
- [ ] Production deploy to Vercel
- [ ] OpenGraph images for shareable project previews
- [ ] Search beyond category filtering
- [ ] Token-in-URL "truly private" links for selectively-shared projects (current Unlisted is YouTube-style — discoverable to anyone who guesses the URL)
