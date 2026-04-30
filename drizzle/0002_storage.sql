-- Public bucket for post cover images and gallery images.
-- public = anyone can read; writes are gated by storage RLS policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
--> statement-breakpoint

-- Public read for the bucket (works because bucket.public = true, but be explicit)
DROP POLICY IF EXISTS "post_media_public_read" ON storage.objects;
--> statement-breakpoint
CREATE POLICY "post_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');
--> statement-breakpoint

-- Authenticated users can upload only into a folder named after their auth.uid()
DROP POLICY IF EXISTS "post_media_insert_own_folder" ON storage.objects;
--> statement-breakpoint
CREATE POLICY "post_media_insert_own_folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint

-- Authenticated users can delete only their own objects
DROP POLICY IF EXISTS "post_media_delete_own" ON storage.objects;
--> statement-breakpoint
CREATE POLICY "post_media_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint

-- Authenticated users can update only their own objects (e.g. metadata edits)
DROP POLICY IF EXISTS "post_media_update_own" ON storage.objects;
--> statement-breakpoint
CREATE POLICY "post_media_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
