-- File Manager bucket + RLS policies
-- Idempotent: safe to run multiple times

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('file-manager', 'file-manager', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "file_manager_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "file_manager_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "file_manager_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "file_manager_authenticated_delete" ON storage.objects;

CREATE POLICY "file_manager_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'file-manager');

CREATE POLICY "file_manager_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'file-manager');

CREATE POLICY "file_manager_authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'file-manager')
  WITH CHECK (bucket_id = 'file-manager');

CREATE POLICY "file_manager_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'file-manager');
