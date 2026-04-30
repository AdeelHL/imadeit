-- Enable Row-Level Security on all public tables
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views  ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- profiles: anyone can read; only owner can insert/update; no client-side delete (cascades from auth.users)
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
--> statement-breakpoint

-- posts: anyone can read published; only author can insert/update/delete (any status)
CREATE POLICY "posts_select_published" ON public.posts FOR SELECT USING (status = 'published' OR author_id = auth.uid());
CREATE POLICY "posts_insert_own"       ON public.posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts_update_own"       ON public.posts FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts_delete_own"       ON public.posts FOR DELETE USING (author_id = auth.uid());
--> statement-breakpoint

-- post_images: read if parent post is readable; write if parent post is owned
CREATE POLICY "post_images_select" ON public.post_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.status = 'published' OR p.author_id = auth.uid()))
);
CREATE POLICY "post_images_write"  ON public.post_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
);
--> statement-breakpoint

-- tags: anyone reads; only authenticated users can create new tags (avoids spam from anon)
CREATE POLICY "tags_select_all"   ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_insert_authed" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);
--> statement-breakpoint

-- post_tags: read if parent post is readable; write if parent post is owned
CREATE POLICY "post_tags_select" ON public.post_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.status = 'published' OR p.author_id = auth.uid()))
);
CREATE POLICY "post_tags_write"  ON public.post_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
);
--> statement-breakpoint

-- comments: anyone reads if parent post readable; auth users insert their own; only author deletes
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.status = 'published' OR p.author_id = auth.uid()))
);
CREATE POLICY "comments_insert_own"  ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete_own"  ON public.comments FOR DELETE USING (author_id = auth.uid());
--> statement-breakpoint

-- post_views: clients should never read or write directly. All inserts go through a SECURITY DEFINER RPC.
-- (No policies = no access for non-superusers, which is what we want.)
--> statement-breakpoint

-- Trigger: auto-create profile row on new auth.users insert (uses email-derived username placeholder)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  candidate     text;
  suffix        int := 0;
BEGIN
  base_username := regexp_replace(coalesce(split_part(NEW.email, '@', 1), 'user'), '[^a-zA-Z0-9_]', '', 'g');
  IF base_username = '' THEN base_username := 'user'; END IF;
  candidate := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  END LOOP;
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, candidate);
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint

-- Trigger: maintain posts.view_count on post_views insert (dedup is enforced by the PK)
CREATE OR REPLACE FUNCTION public.bump_view_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_post_view_inserted ON public.post_views;
--> statement-breakpoint
CREATE TRIGGER on_post_view_inserted
AFTER INSERT ON public.post_views
FOR EACH ROW EXECUTE FUNCTION public.bump_view_count();
--> statement-breakpoint

-- RPC: clients call this instead of inserting into post_views directly. ON CONFLICT DO NOTHING handles dedup.
CREATE OR REPLACE FUNCTION public.record_post_view(p_post_id uuid, p_viewer_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id AND status = 'published') THEN
    RETURN;
  END IF;
  INSERT INTO public.post_views (post_id, viewer_hash, viewed_on)
  VALUES (p_post_id, p_viewer_hash, current_date)
  ON CONFLICT DO NOTHING;
END;
$$;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.record_post_view(uuid, text) TO anon, authenticated;
--> statement-breakpoint

-- Trigger: keep posts.updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS posts_touch_updated_at ON public.posts;
--> statement-breakpoint
CREATE TRIGGER posts_touch_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
