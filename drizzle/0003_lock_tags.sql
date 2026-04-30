-- Tags are now a curated/admin-only list. Drop the policy that let any
-- authenticated user insert new tags. Reads remain public; writes only via
-- the service role (e.g. our seed script) which bypasses RLS.
DROP POLICY IF EXISTS "tags_insert_authed" ON public.tags;
