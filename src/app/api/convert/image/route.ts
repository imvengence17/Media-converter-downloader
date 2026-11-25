import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import archiver from 'archiver';
import { saveTempFile, createTempFile, deleteTempFile, getFileFromTmp } from '@/lib/file-storage';
import { getFileExtension } from '@/lib/utils';
import { fetchImageFromUrl, formatYtDlpError } from '@/lib/ytdlp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const url = (formData.get('url') as string | null)?.trim() || '';
    const outputFormat = ((formData.get('outputFormat') as string) || 'png').toLowerCase();
    const quality = parseInt((formData.get('quality') as string) || '85', 10);
    const enableResize = formData.get('enableResize') === 'true';
    const widthStr = formData.get('width') as string | null;
    const heightStr = formData.get('height') as string | null;
    const maintainAspectRatio = formData.get('maintainAspectRatio') !== 'false';
    const enableCompress = formData.get('enableCompress') === 'true';

    const inputItems: Array<{ buffer: Buffer; name: string }> = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        inputItems.push({ buffer: Buffer.from(bytes), name: file.name });
      }
    } else if (url) {
      try {
        const fetched = await fetchImageFromUrl(url);
        inputItems.push({ buffer: fetched.buffer, name: fetched.fileName });
      } catch (err: any) {
        return NextResponse.json({ error: formatYtDlpError(err) }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Please upload an image or paste an image/webpage URL' }, { status: 400 });
    }

    const convertedResults = [];

    for (const item of inputItems) {
      const inputBuffer = item.buffer;
      let sharpInstance = sharp(inputBuffer);

      // Metadata check
      const metadata = await sharpInstance.metadata();

      // Resize if enabled
      if (enableResize) {
        const targetWidth = widthStr ? parseInt(widthStr, 10) : undefined;
        const targetHeight = heightStr ? parseInt(heightStr, 10) : undefined;

        if (targetWidth || targetHeight) {
          sharpInstance = sharpInstance.resize({
            width: targetWidth,
            height: targetHeight,
            fit: maintainAspectRatio ? 'inside' : 'fill',
            withoutEnlargement: false,
          });
        }
      }

      // Format & Compression configuration
      const effectiveQuality = enableCompress ? Math.min(quality, 65) : quality;
      let targetExt = outputFormat;

      switch (outputFormat) {
        case 'jpg':
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: effectiveQuality, mozjpeg: true });
          targetExt = 'jpg';
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            compressionLevel: enableCompress ? 9 : 6,
            quality: effectiveQuality,
          });
          targetExt = 'png';
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: effectiveQuality });
          targetExt = 'webp';
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality: effectiveQuality });
          targetExt = 'avif';
          break;
        case 'gif':
          sharpInstance = sharpInstance.gif();
          targetExt = 'gif';
          break;
        case 'tiff':
        case 'tif':
          sharpInstance = sharpInstance.tiff({ quality: effectiveQuality });
          targetExt = 'tiff';
          break;
        case 'ico':
          // Convert to 256x256 PNG for ICO compatibility
          sharpInstance = sharpInstance.resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png();
          targetExt = 'ico';
          break;
        case 'bmp':
          // Sharp doesn't write raw BMP directly, fall back to PNG with bmp extension or standard png
          sharpInstance = sharpInstance.png();
          targetExt = 'bmp';
          break;
        default:
          sharpInstance = sharpInstance.png();
          targetExt = 'png';
          break;
      }

      const outputBuffer = await sharpInstance.toBuffer();
      const outputMeta = await sharp(outputBuffer).metadata();

      const { id: outputId, path: outputPath } = createTempFile(targetExt);
      fs.writeFileSync(outputPath, outputBuffer);

      const baseNameWithoutExt = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const finalFileName = `${baseNameWithoutExt}_converted.${targetExt}`;

      convertedResults.push({
        id: outputId,
        fileName: finalFileName,
        fileSize: outputBuffer.length,
        downloadUrl: `/api/download/${outputId}?name=${encodeURIComponent(finalFileName)}`,
        width: outputMeta.width || metadata.width || 0,
        height: outputMeta.height || metadata.height || 0,
      });
    }

    return NextResponse.json({ files: convertedResults });
  } catch (error: any) {
    console.error('Image conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Image conversion failed. Please verify format compatibility.' },
      { status: 500 }
    );
  }
}

// GET endpoint to download a batch of converted images as ZIP
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'No file IDs provided for ZIP archive' }, { status: 400 });
    }

    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Empty file list' }, { status: 400 });
    }

    const { id: zipId, path: zipPath } = createTempFile('zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);

      for (const id of ids) {
        const { path: filePath, exists } = getFileFromTmp(id);
        if (exists && fs.existsSync(filePath)) {
          const fileName = path.basename(filePath);
          archive.file(filePath, { name: fileName });
        }
      }

      archive.finalize();
    });

    const zipBuffer = fs.readFileSync(zipPath);
    const stat = fs.statSync(zipPath);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': 'attachment; filename="converted-images.zip"',
      },
    });
  } catch (error: any) {
    console.error('Batch ZIP creation error:', error);
    return NextResponse.json({ error: 'Failed to create ZIP package' }, { status: 500 });
  }
}
