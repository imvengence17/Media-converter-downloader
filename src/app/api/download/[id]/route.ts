import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFileFromTmp } from '@/lib/file-storage';
import { getMimeType, getFileExtension } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const { path: filePath, exists } = getFileFromTmp(id);

    if (!exists || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found or has expired' }, { status: 404 });
    }

    const fileName = path.basename(filePath);
    const ext = getFileExtension(fileName);
    const mimeType = getMimeType(ext);
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    // Optional custom filename from query string
    const searchParams = request.nextUrl.searchParams;
    const downloadName = searchParams.get('name') || fileName;
    const asciiFallback = downloadName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    const utf8Encoded = encodeURIComponent(downloadName);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
