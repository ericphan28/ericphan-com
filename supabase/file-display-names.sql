-- Mapping storage_key (ASCII) -> display_name (Unicode, e.g. tiếng Việt)
-- Allows the file manager to keep pretty names while storage keys stay ASCII.

CREATE TABLE IF NOT EXISTS public.file_display_names (
  bucket_id    text NOT NULL,
  storage_key  text NOT NULL,
  display_name text NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_id, storage_key)
);

CREATE INDEX IF NOT EXISTS file_display_names_bucket_prefix_idx
  ON public.file_display_names (bucket_id, storage_key text_pattern_ops);

ALTER TABLE public.file_display_names ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fdn_authenticated_select" ON public.file_display_names;
DROP POLICY IF EXISTS "fdn_authenticated_insert" ON public.file_display_names;
DROP POLICY IF EXISTS "fdn_authenticated_update" ON public.file_display_names;
DROP POLICY IF EXISTS "fdn_authenticated_delete" ON public.file_display_names;

CREATE POLICY "fdn_authenticated_select"
  ON public.file_display_names FOR SELECT TO authenticated USING (true);

CREATE POLICY "fdn_authenticated_insert"
  ON public.file_display_names FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "fdn_authenticated_update"
  ON public.file_display_names FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "fdn_authenticated_delete"
  ON public.file_display_names FOR DELETE TO authenticated USING (true);
