import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage service wrapper for Supabase Storage
 * 
 * Features:
 * - Unified upload/download interface
 * - Progress tracking
 * - Retry logic
 * - Error handling
 * - Batch operations
 */

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  retries?: number;
  metadata?: Record<string, any>;
}

export interface DownloadOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Upload file with progress tracking
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucketName: string,
  path: string,
  file: File,
  options: UploadOptions = {}
): Promise<{ data: any; error: any }> {
  const { onProgress, retries = 3, metadata = {} } = options;

  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Simple upload (no native progress in Supabase)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...metadata,
        });

      if (error) throw error;

      onProgress?.(100);
      return { data, error: null };
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return { data: null, error: lastError };
}

/**
 * Download file with progress tracking
 */
export async function downloadFile(
  supabase: SupabaseClient,
  bucketName: string,
  path: string,
  options: DownloadOptions = {}
): Promise<{ data: Blob | null; error: any }> {
  const { onProgress } = options;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);

    if (error) throw error;

    onProgress?.(100);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(
  supabase: SupabaseClient,
  bucketName: string,
  paths: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const path of paths) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) throw error;
      success.push(path);
    } catch (error) {
      failed.push(path);
    }
  }

  return { success, failed };
}

/**
 * Copy file to new location
 */
export async function copyFile(
  supabase: SupabaseClient,
  bucketName: string,
  sourcePath: string,
  destPath: string
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .copy(sourcePath, destPath);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Move file to new location
 */
export async function moveFile(
  supabase: SupabaseClient,
  bucketName: string,
  sourcePath: string,
  destPath: string
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .move(sourcePath, destPath);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get public URL for file
 */
export function getPublicUrl(
  supabase: SupabaseClient,
  bucketName: string,
  path: string
): string {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Create signed URL with expiry
 */
export async function createSignedUrl(
  supabase: SupabaseClient,
  bucketName: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return { url: data?.signedUrl || null, error: null };
  } catch (error) {
    return { url: null, error };
  }
}

/**
 * List files in folder
 */
export async function listFiles(
  supabase: SupabaseClient,
  bucketName: string,
  path: string = '',
  options: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  } = {}
): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: 'name', order: 'asc' },
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
