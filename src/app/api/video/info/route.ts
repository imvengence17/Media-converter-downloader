import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoInfo, isDirectMediaUrl, validatePublicVideoUrl } from '@/lib/ytdlp';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const parsed = validatePublicVideoUrl(url);

    if (isDirectMediaUrl(url)) {
      return NextResponse.json({
        title: path.basename(parsed.pathname) || 'Direct Media File',
        thumbnail: null,
        duration: null,
        extractor: 'Direct Link',
        uploader: parsed.hostname,
        webpageUrl: url,
      });
    }

    const info = await fetchVideoInfo(url);
    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Video info fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Could not retrieve video information from URL' },
      { status: 400 }
    );
  }
}
