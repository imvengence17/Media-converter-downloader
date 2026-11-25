export type ConversionType = 'video' | 'image' | 'audio' | 'pdf' | 'ocr';

export type ConversionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface ConversionJob {
  id: string;
  type: ConversionType;
  status: ConversionStatus;
  progress: number;
  inputFile: FileInfo;
  outputFormat: string;
  outputFile?: FileInfo;
  settings?: ConversionSettings;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  path?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  bitrate?: number;
}

export interface ConversionSettings {
  quality?: number;
  resolution?: string;
  bitrate?: string;
  codec?: string;
  fps?: number;
  width?: number;
  height?: number;
  trim?: { start: number; end: number };
  audioBitrate?: string;
}

export interface VideoInfo {
  title?: string;
  thumbnail?: string;
  channel?: string;
  platform?: string;
  duration?: number;
  uploadDate?: string;
  resolution?: string;
  format?: string;
  fileSize?: number;
  description?: string;
  availableResolutions?: string[];
}

export interface ConversionHistoryItem {
  id: string;
  type: ConversionType;
  inputFileName: string;
  outputFileName: string;
  outputFormat: string;
  fileSize: number;
  convertedAt: string;
  downloadUrl?: string;
}

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ConversionType;
  inputFormats: string[];
  outputFormats: string[];
  href: string;
}

export const VIDEO_FORMATS = ['MP4', 'MKV', 'MOV', 'AVI', 'WEBM', 'GIF'] as const;
export const AUDIO_FORMATS = ['MP3', 'WAV', 'AAC', 'M4A', 'FLAC', 'OGG', 'WMA', 'OPUS'] as const;
export const IMAGE_FORMATS = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF', 'SVG', 'ICO', 'AVIF'] as const;

export const VIDEO_RESOLUTIONS = [
  { label: '4K (2160p)', value: '2160', width: 3840, height: 2160 },
  { label: '1080p Full HD', value: '1080', width: 1920, height: 1080 },
  { label: '720p HD', value: '720', width: 1280, height: 720 },
  { label: '480p SD', value: '480', width: 854, height: 480 },
  { label: '360p', value: '360', width: 640, height: 360 },
] as const;

export const AUDIO_BITRATES = [
  { label: '320 kbps (Highest)', value: '320k' },
  { label: '256 kbps (High)', value: '256k' },
  { label: '192 kbps (Medium)', value: '192k' },
  { label: '128 kbps (Standard)', value: '128k' },
] as const;

export type VideoFormat = typeof VIDEO_FORMATS[number];
export type AudioFormat = typeof AUDIO_FORMATS[number];
export type ImageFormat = typeof IMAGE_FORMATS[number];
