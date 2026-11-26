import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { buildDownloadUrl, saveTempFile, createTempFile, deleteTempFile, ensureTmpDir } from '@/lib/file-storage';
import { getFileExtension } from '@/lib/utils';
import {
  downloadVideoWithYtDlp,
  formatYtDlpError,
  getFfmpegPath,
  isDirectMediaUrl,
  validatePublicVideoUrl,
} from '@/lib/ytdlp';

export async function POST(request: NextRequest) {
  let inputPath = '';
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const outputFormat = ((formData.get('outputFormat') as string) || 'mp3').toLowerCase();
    const bitrate = (formData.get('bitrate') as string) || '192k';
    const trimStart = formData.get('trimStart') as string | null;
    const trimEnd = formData.get('trimEnd') as string | null;

    let originalName = 'audio.mp3';
    let downloadedFromPlatform = false;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      originalName = file.name;
      const inExt = getFileExtension(file.name) || 'mp3';
      const saved = saveTempFile(buffer, inExt);
      inputPath = saved.path;
    } else if (url) {
      const trimmedUrl = url.trim();
      let parsedUrl: URL;
      try {
        parsedUrl = validatePublicVideoUrl(trimmedUrl);
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Invalid or restricted URL' }, { status: 400 });
      }

      if (isDirectMediaUrl(trimmedUrl)) {
        try {
          const res = await fetch(trimmedUrl, { headers: { 'User-Agent': 'MediaConvert/1.0' } });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && !contentType.includes('text/html')) {
            const bytes = await res.arrayBuffer();
            const buffer = Buffer.from(bytes);
            originalName = path.basename(parsedUrl.pathname) || 'downloaded-audio.mp3';
            const inExt = getFileExtension(originalName) || 'mp3';
            const saved = saveTempFile(buffer, inExt);
            inputPath = saved.path;
          }
        } catch {
          // Fall through to yt-dlp
        }
      }

      if (!inputPath) {
        try {
          const tmpDir = ensureTmpDir();
          const dl = await downloadVideoWithYtDlp({
            url: trimmedUrl,
            outputDir: tmpDir,
            fileId: uuidv4(),
            audioOnly: true,
          });
          inputPath = dl.filePath;
          const dlExt = getFileExtension(dl.filePath) || 'm4a';
          originalName = `${dl.title}.${dlExt}`;
          downloadedFromPlatform = true;
        } catch (err: any) {
          return NextResponse.json(
            { error: formatYtDlpError(err) },
            { status: 400 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Please upload an audio file or paste a video/audio URL' },
        { status: 400 }
      );
    }

    const targetExt = outputFormat;
    const { id: outputId, path: outputPath } = createTempFile(targetExt);

    let ffmpeg: any;
    try {
      ffmpeg = (await import('fluent-ffmpeg')).default;
      const resolvedFfmpeg = await getFfmpegPath();
      if (resolvedFfmpeg) {
        ffmpeg.setFfmpegPath(resolvedFfmpeg);
      }
    } catch (e) {
      console.warn('FFmpeg library load failed:', e);
    }

    if (ffmpeg) {
      await new Promise<void>((resolve, reject) => {
        let command = ffmpeg(inputPath).noVideo();

        switch (targetExt) {
          case 'mp3':
            command = command.audioCodec('libmp3lame').audioBitrate(bitrate);
            break;
          case 'wav':
            command = command.audioCodec('pcm_s16le');
            break;
          case 'aac':
            command = command.audioCodec('aac').audioBitrate(bitrate);
            break;
          case 'm4a':
            command = command.audioCodec('aac').audioBitrate(bitrate).format('mp4');
            break;
          case 'flac':
            command = command.audioCodec('flac');
            break;
          case 'ogg':
            command = command.audioCodec('libvorbis').audioBitrate(bitrate);
            break;
          case 'opus':
            command = command.audioCodec('libopus').audioBitrate(bitrate);
            break;
          case 'wma':
            command = command.audioCodec('wmav2').audioBitrate(bitrate);
            break;
          default:
            command = command.audioBitrate(bitrate);
            break;
        }

        if (trimStart && parseFloat(trimStart) > 0) {
          command = command.setStartTime(parseFloat(trimStart));
        }
        if (trimEnd && parseFloat(trimEnd) > 0) {
          const duration = parseFloat(trimEnd) - (trimStart ? parseFloat(trimStart) : 0);
          if (duration > 0) {
            command = command.setDuration(duration);
          }
        }

        command
          .format(targetExt === 'm4a' ? 'mp4' : targetExt)
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .save(outputPath);
      });
    } else {
      fs.copyFileSync(inputPath, outputPath);
    }

    const outputStats = fs.statSync(outputPath);
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const finalFileName = downloadedFromPlatform
      ? `${baseName}.${targetExt}`
      : `${baseName}_converted.${targetExt}`;

    return NextResponse.json({
      id: outputId,
      fileName: finalFileName,
      fileSize: outputStats.size,
      downloadUrl: buildDownloadUrl(outputId, finalFileName, outputPath, targetExt),
    });
  } catch (error: any) {
    console.error('Audio conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert audio file' },
      { status: 500 }
    );
  } finally {
    if (inputPath && fs.existsSync(inputPath)) {
      deleteTempFile(inputPath);
    }
  }
}
