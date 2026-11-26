import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getMimeType } from './utils';

// Use OS temp directory so writes succeed on read-only serverless filesystems (e.g. Vercel /tmp)
const TMP_DIR = path.join(os.tmpdir(), 'mediaconvert-tmp');
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_FILE_AGE = 60 * 60 * 1000; // 1 hour
const INLINE_DOWNLOAD_MAX_BYTES = 2.5 * 1024 * 1024; // 2.5 MB raw (~3.3 MB base64, under Vercel 4.5 MB limit)

export function ensureTmpDir(): string {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
  return TMP_DIR;
}

export function createTempFile(ext: string): { id: string; path: string } {
  ensureTmpDir();
  const id = uuidv4();
  const filePath = path.join(TMP_DIR, `${id}.${ext}`);
  return { id, path: filePath };
}

export function getTempFilePath(id: string, ext?: string): string {
  ensureTmpDir();
  if (ext) {
    return path.join(TMP_DIR, `${id}.${ext}`);
  }
  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(id));
  if (files.length > 0) {
    return path.join(TMP_DIR, files[0]);
  }
  return path.join(TMP_DIR, id);
}

export function saveTempFile(buffer: Buffer, ext: string): { id: string; path: string } {
  const { id, path: filePath } = createTempFile(ext);
  fs.writeFileSync(filePath, buffer);
  return { id, path: filePath };
}

export function deleteTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting temp file:', error);
  }
}

/**
 * Returns an inline data URL for files <= 3.5 MB (works across stateless Vercel containers),
 * or falls back to /api/download/[id] for larger files.
 */
export function buildDownloadUrl(
  id: string,
  fileName: string,
  bufferOrPath: Buffer | string,
  ext?: string
): string {
  try {
    const buffer = typeof bufferOrPath === 'string' ? fs.readFileSync(bufferOrPath) : bufferOrPath;
    if (buffer.length <= INLINE_DOWNLOAD_MAX_BYTES) {
      const resolvedExt = ext || path.extname(fileName).replace('.', '') || 'bin';
      const mime = getMimeType(resolvedExt);
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } catch (err) {
    console.warn('Inline data URL fallback to /api/download:', err);
  }
  return `/api/download/${id}?name=${encodeURIComponent(fileName)}`;
}

export function cleanupOldFiles(): void {
  try {
    ensureTmpDir();
    const files = fs.readdirSync(TMP_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(TMP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > MAX_FILE_AGE) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldFiles, CLEANUP_INTERVAL);
}

export function getFileFromTmp(id: string): { path: string; exists: boolean } {
  ensureTmpDir();
  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(id));
  if (files.length > 0) {
    const filePath = path.join(TMP_DIR, files[0]);
    return { path: filePath, exists: true };
  }
  return { path: '', exists: false };
}
