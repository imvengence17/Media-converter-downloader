import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { fetchImageFromUrl, formatYtDlpError } from '@/lib/ytdlp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const { buffer, fileName, sourceType } = await fetchImageFromUrl(url);
    const metadata = await sharp(buffer).metadata();
    const mime = metadata.format ? `image/${metadata.format === 'jpeg' ? 'jpeg' : metadata.format}` : 'image/png';
    const preview = `data:${mime};base64,${buffer.toString('base64')}`;

    return NextResponse.json({
      fileName,
      sourceType,
      width: metadata.width || 0,
      height: metadata.height || 0,
      fileSize: buffer.length,
      preview,
    });
  } catch (error: any) {
    console.error('Image info fetch error:', error);
    return NextResponse.json(
      { error: formatYtDlpError(error) },
      { status: 400 }
    );
  }
}
