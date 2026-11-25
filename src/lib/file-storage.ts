import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = path.join(process.cwd(), 'tmp');
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_FILE_AGE = 60 * 60 * 1000; // 1 hour

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
  if (ext) {
    return path.join(TMP_DIR, `${id}.${ext}`);
  }
  // Find file with any extension
  const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(id));
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

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldFiles, CLEANUP_INTERVAL);
}

export function getFileFromTmp(id: string): { path: string; exists: boolean } {
  ensureTmpDir();
  const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(id));
  if (files.length > 0) {
    const filePath = path.join(TMP_DIR, files[0]);
    return { path: filePath, exists: true };
  }
  return { path: '', exists: false };
}
