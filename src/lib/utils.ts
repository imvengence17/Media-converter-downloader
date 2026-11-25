import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    wma: 'audio/x-ms-wma',
    opus: 'audio/opus',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    avif: 'image/avif',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}

export function isVideoFormat(ext: string): boolean {
  return ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'wmv', 'm4v', '3gp'].includes(ext.toLowerCase());
}

export function isAudioFormat(ext: string): boolean {
  return ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma', 'opus', 'aiff'].includes(ext.toLowerCase());
}

export function isImageFormat(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'svg', 'ico', 'avif'].includes(ext.toLowerCase());
}

export function isPdfFormat(ext: string): boolean {
  return ext.toLowerCase() === 'pdf';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function truncateFilename(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) return name;
  const ext = getFileExtension(name);
  const baseName = name.slice(0, name.lastIndexOf('.'));
  const truncated = baseName.slice(0, maxLength - ext.length - 4);
  return `${truncated}...${ext ? `.${ext}` : ''}`;
}

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100MB

export function validateFileSize(size: number, type: 'video' | 'audio' | 'image' | 'pdf'): { valid: boolean; message?: string } {
  const limits: Record<string, number> = {
    video: MAX_FILE_SIZE,
    audio: MAX_FILE_SIZE,
    image: MAX_IMAGE_SIZE,
    pdf: MAX_PDF_SIZE,
  };
  const limit = limits[type] || MAX_FILE_SIZE;
  if (size > limit) {
    return { valid: false, message: `File size exceeds ${formatFileSize(limit)} limit` };
  }
  return { valid: true };
}
