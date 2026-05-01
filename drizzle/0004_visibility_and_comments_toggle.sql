-- Per-post knob for whether new comments are accepted.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true;
--> statement-breakpoint

-- Lock down the status field to the three values the app supports.
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_check;
--> statement-breakpoint
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('published', 'unlisted', 'draft'));
--> statement-breakpoint

-- Replace the read policy so anyone can SELECT unlisted posts (URL-gated by
-- convention; not in any feed query). Drafts still author-only.
DROP POLICY IF EXISTS "posts_select_published" ON public.posts;
--> statement-breakpoint
CREATE POLICY "posts_select_published" ON public.posts FOR SELECT USING (
  status IN ('published', 'unlisted') OR author_id = auth.uid()
);
--> statement-breakpoint

-- Replace the comments insert policy so it also checks the parent post still
-- accepts comments. Without this an attacker could POST a comment via the
-- raw Supabase REST API even after the author disabled comments.
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
--> statement-breakpoint
CREATE POLICY "comments_insert_own" ON public.comments
FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id
      AND p.comments_enabled = true
      AND (p.status IN ('published', 'unlisted') OR p.author_id = auth.uid())
  )
);
