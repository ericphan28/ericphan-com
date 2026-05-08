import JSZip from 'jszip';

export type CompressionFormat = 'zip' | 'gzip' | 'tar';

/**
 * Compression service for file operations
 * 
 * Features:
 * - ZIP compression (JSZip)
 * - GZIP compression (pako)
 * - TAR archive (basic implementation)
 * - Extract archives
 */

/**
 * Compress files into ZIP archive
 */
export async function compressToZip(
  files: { name: string; content: ArrayBuffer }[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Compress single file with GZIP
 */
export async function compressToGzip(content: ArrayBuffer): Promise<Uint8Array> {
  const pako = await import('pako');
  const uint8Array = new Uint8Array(content);
  return pako.gzip(uint8Array);
}

/**
 * Decompress GZIP file
 */
export async function decompressGzip(content: ArrayBuffer): Promise<Uint8Array> {
  const pako = await import('pako');
  const uint8Array = new Uint8Array(content);
  return pako.ungzip(uint8Array);
}

/**
 * Extract ZIP archive
 */
export async function extractZip(
  zipBlob: Blob
): Promise<{ name: string; content: ArrayBuffer }[]> {
  const zip = await JSZip.loadAsync(zipBlob);
  const files: { name: string; content: ArrayBuffer }[] = [];

  for (const [name, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      const content = await file.async('arraybuffer');
      files.push({ name, content });
    }
  }

  return files;
}

/**
 * List contents of ZIP archive without extracting
 */
export async function listZipContents(
  zipBlob: Blob
): Promise<{ name: string; size: number; compressed: number }[]> {
  const zip = await JSZip.loadAsync(zipBlob);
  const contents: { name: string; size: number; compressed: number }[] = [];

  for (const [name, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      const content = await file.async('arraybuffer');
      const size = content.byteLength;
      const compressed = 0; // Cannot access _data in types
      contents.push({
        name,
        size,
        compressed,
      });
    }
  }

  return contents;
}

/**
 * Basic TAR archive creation (simplified)
 */
export function createTar(
  files: { name: string; content: ArrayBuffer }[]
): Uint8Array {
  // Simplified TAR implementation
  // In production, use a proper TAR library
  const blocks: Uint8Array[] = [];

  for (const file of files) {
    const header = new Uint8Array(512);
    const nameBytes = new TextEncoder().encode(file.name);

    // Write name
    header.set(nameBytes.slice(0, 100), 0);

    // Write size (octal)
    const sizeOctal = file.content.byteLength.toString(8).padStart(11, '0');
    header.set(new TextEncoder().encode(sizeOctal), 124);

    blocks.push(header);

    // Write content (padded to 512-byte blocks)
    const content = new Uint8Array(file.content);
    const paddedSize = Math.ceil(content.length / 512) * 512;
    const paddedContent = new Uint8Array(paddedSize);
    paddedContent.set(content);
    blocks.push(paddedContent);
  }

  // End with two empty blocks
  blocks.push(new Uint8Array(512));
  blocks.push(new Uint8Array(512));

  // Concatenate all blocks
  const totalLength = blocks.reduce((sum, block) => sum + block.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const block of blocks) {
    result.set(block, offset);
    offset += block.length;
  }

  return result;
}

/**
 * Get compression format from filename
 */
export function getCompressionFormat(filename: string): CompressionFormat | null {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'zip':
      return 'zip';
    case 'gz':
    case 'gzip':
      return 'gzip';
    case 'tar':
      return 'tar';
    default:
      return null;
  }
}

/**
 * Check if file is compressed archive
 */
export function isArchive(filename: string): boolean {
  return getCompressionFormat(filename) !== null;
}
