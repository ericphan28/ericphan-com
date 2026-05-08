/**
 * File hashing service for deduplication and integrity
 * 
 * Features:
 * - SHA-256 hashing
 * - MD5 hashing (for compatibility)
 * - File comparison
 * - Duplicate detection
 */

/**
 * Calculate SHA-256 hash of file content
 */
export async function calculateSHA256(content: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Tính hash SHA-1 của file content
 * Dùng khi cần hash nhanh hơn SHA-256 (ít secure hơn nhưng nhanh hơn)
 * Lưu ý: SHA-1 không phải MD5, đây là hash thay thế vì Web Crypto API không hỗ trợ MD5
 */
export async function calculateSHA1(content: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @deprecated Dùng calculateSHA1() thay thế. Hàm này giữ lại để backward compatibility.
 */
export const calculateMD5Alternative = calculateSHA1;

/**
 * Quick hash for small files (first 1MB only)
 */
export async function calculateQuickHash(content: ArrayBuffer): Promise<string> {
  const maxSize = 1024 * 1024; // 1MB
  const slice = content.byteLength > maxSize
    ? content.slice(0, maxSize)
    : content;

  return calculateSHA256(slice);
}

/**
 * Compare two files by hash
 */
export async function filesAreIdentical(
  content1: ArrayBuffer,
  content2: ArrayBuffer
): Promise<boolean> {
  if (content1.byteLength !== content2.byteLength) {
    return false;
  }

  const hash1 = await calculateSHA256(content1);
  const hash2 = await calculateSHA256(content2);

  return hash1 === hash2;
}

/**
 * Find duplicate files in a list
 */
export async function findDuplicates(
  files: { name: string; content: ArrayBuffer }[]
): Promise<Map<string, string[]>> {
  const hashMap = new Map<string, string[]>();

  for (const file of files) {
    const hash = await calculateSHA256(file.content);

    if (hashMap.has(hash)) {
      hashMap.get(hash)!.push(file.name);
    } else {
      hashMap.set(hash, [file.name]);
    }
  }

  // Filter to only duplicates
  const duplicates = new Map<string, string[]>();
  for (const [hash, names] of hashMap.entries()) {
    if (names.length > 1) {
      duplicates.set(hash, names);
    }
  }

  return duplicates;
}

/**
 * Generate content-based filename
 */
export async function generateContentBasedName(
  content: ArrayBuffer,
  extension: string
): Promise<string> {
  const hash = await calculateSHA256(content);
  const shortHash = hash.slice(0, 12);
  return `${shortHash}.${extension}`;
}

/**
 * Verify file integrity with expected hash
 */
export async function verifyIntegrity(
  content: ArrayBuffer,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await calculateSHA256(content);
  return actualHash === expectedHash;
}
