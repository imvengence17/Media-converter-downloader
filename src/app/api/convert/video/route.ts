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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let inputPath = '';
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const outputFormat = ((formData.get('outputFormat') as string) || 'mp4').toLowerCase();
    const resolution = (formData.get('resolution') as string) || '1080';
    const quality = parseInt((formData.get('quality') as string) || '80', 10);
    const extractAudio = formData.get('extractAudio') === 'true';
    const audioFormat = ((formData.get('audioFormat') as string) || 'mp3').toLowerCase();
    const audioBitrate = (formData.get('audioBitrate') as string) || '192k';

    let originalName = 'video.mp4';
    let downloadedFromPlatform = false;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      originalName = file.name;
      const inExt = getFileExtension(originalName) || 'mp4';
      const savedInput = saveTempFile(buffer, inExt);
      inputPath = savedInput.path;
    } else if (url) {
      const trimmedUrl = url.trim();
      let parsedUrl: URL;
      try {
        parsedUrl = validatePublicVideoUrl(trimmedUrl);
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || 'Invalid or restricted URL' },
          { status: 400 }
        );
      }

      if (isDirectMediaUrl(trimmedUrl)) {
        try {
          const res = await fetch(trimmedUrl, { headers: { 'User-Agent': 'MediaConvert/1.0' } });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && !contentType.includes('text/html')) {
            const bytes = await res.arrayBuffer();
            const buffer = Buffer.from(bytes);
            originalName = path.basename(parsedUrl.pathname) || 'downloaded-video.mp4';
            const inExt = getFileExtension(originalName) || 'mp4';
            const savedInput = saveTempFile(buffer, inExt);
            inputPath = savedInput.path;
          }
        } catch {
          // Fall through to yt-dlp
        }
      }

      if (!inputPath) {
        try {
          const tmpDir = ensureTmpDir();
          const maxHeight = parseInt(resolution, 10) || 1080;
          const dl = await downloadVideoWithYtDlp({
            url: trimmedUrl,
            outputDir: tmpDir,
            fileId: uuidv4(),
            maxHeight: extractAudio ? undefined : maxHeight,
            audioOnly: extractAudio,
          });
          inputPath = dl.filePath;
          const dlExt = getFileExtension(dl.filePath) || 'mp4';
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
      return NextResponse.json({ error: 'Please provide either a video file or a video URL' }, { status: 400 });
    }

    const inExt = getFileExtension(inputPath) || getFileExtension(originalName) || 'mp4';
    const targetExt = extractAudio ? audioFormat : outputFormat;
    const { id: outputId, path: outputPath } = createTempFile(targetExt);

    // Fast path: if yt-dlp already downloaded an MP4 at the target resolution and user wants MP4 at standard/high quality
    if (downloadedFromPlatform && !extractAudio && inExt === 'mp4' && targetExt === 'mp4' && quality >= 75) {
      try {
        fs.renameSync(inputPath, outputPath);
      } catch {
        fs.copyFileSync(inputPath, outputPath);
      }
    } else {
      // Run conversion with fluent-ffmpeg if available
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
          let command = ffmpeg(inputPath);

          if (extractAudio) {
            command = command.noVideo().audioBitrate(audioBitrate);
            if (targetExt === 'mp3') command = command.audioCodec('libmp3lame');
            else if (targetExt === 'wav') command = command.audioCodec('pcm_s16le');
            else if (targetExt === 'aac') command = command.audioCodec('aac');
            else if (targetExt === 'flac') command = command.audioCodec('flac');
            else if (targetExt === 'ogg') command = command.audioCodec('libvorbis');
          } else {
            const resScaleMap: Record<string, string> = {
              '2160': 'scale=-2:2160',
              '1080': 'scale=-2:1080',
              '720': 'scale=-2:720',
              '480': 'scale=-2:480',
              '360': 'scale=-2:360',
            };

            if (resScaleMap[resolution] && targetExt !== 'gif') {
              command = command.outputOptions(['-vf', resScaleMap[resolution]]);
            }

            if (targetExt === 'mp4') {
              const crf = Math.max(18, Math.min(35, Math.round(51 - quality * 0.33)));
              command = command.videoCodec('libx264').outputOptions(['-crf', crf.toString(), '-preset', 'medium']);
            } else if (targetExt === 'webm') {
              command = command.videoCodec('libvpx-vp9');
            } else if (targetExt === 'gif') {
              command = command.outputOptions(['-vf', 'fps=15,scale=480:-1:flags=lanczos']);
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
    }

    const outputStats = fs.statSync(outputPath);
    const baseNameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const finalDownloadName = downloadedFromPlatform
      ? `${baseNameWithoutExt}.${targetExt}`
      : `${baseNameWithoutExt}_converted.${targetExt}`;

    return NextResponse.json({
      id: outputId,
      fileName: finalDownloadName,
      fileSize: outputStats.size,
      downloadUrl: buildDownloadUrl(outputId, finalDownloadName, outputPath, targetExt),
    });
  } catch (error: any) {
    console.error('Video conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert video. Please check input file or format options.' },
      { status: 500 }
    );
  } finally {
    if (inputPath && fs.existsSync(inputPath)) {
      deleteTempFile(inputPath);
    }
  }
}
