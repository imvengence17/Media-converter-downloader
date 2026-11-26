import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface VideoUrlInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  extractor: string;
  uploader: string | null;
  webpageUrl: string;
}

const DIRECT_MEDIA_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.mov',
  '.avi',
  '.webm',
  '.flv',
  '.wmv',
  '.m4v',
  '.ts',
  '.mp3',
  '.wav',
  '.aac',
  '.flac',
  '.ogg',
  '.m4a',
]);

/**
 * Checks if a URL points to a direct media file rather than a web page (e.g., YouTube, TikTok, Instagram).
 */
export function isDirectMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    return DIRECT_MEDIA_EXTENSIONS.has(ext);
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is public HTTP/HTTPS and does not target localhost or private networks (SSRF guard).
 */
export function validatePublicVideoUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.endsWith('.local')
  ) {
    throw new Error('Direct access to internal network URLs is restricted');
  }
  return parsed;
}

/**
 * Resolves the yt-dlp binary path on Windows/Linux/macOS.
 */
export function getYtDlpPath(): string {
  if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
    return process.env.YTDLP_PATH;
  }
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = [
      path.join(localAppData, 'Programs', 'Python', 'Python314', 'Scripts', 'yt-dlp.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python313', 'Scripts', 'yt-dlp.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python312', 'Scripts', 'yt-dlp.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python311', 'Scripts', 'yt-dlp.exe'),
      path.join(localAppData, 'Microsoft', 'WinGet', 'Links', 'yt-dlp.exe'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return 'yt-dlp';
}

export async function getFfmpegPath(): Promise<string | null> {
  const binaryName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', binaryName);
  if (fs.existsSync(nodeModulesPath)) {
    return nodeModulesPath;
  }
  try {
    const ffmpegStatic = (await import('ffmpeg-static')).default;
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      return ffmpegStatic;
    }
  } catch {
    // Ignore and fall back to system ffmpeg if available
  }
  return null;
}

/**
 * Fast metadata lookup via oEmbed / OpenGraph HTML tags (<1s), falling back to yt-dlp.
 */
export async function fetchVideoInfo(url: string): Promise<VideoUrlInfo> {
  const parsed = validatePublicVideoUrl(url);
  const host = parsed.hostname.toLowerCase();
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };

  // Fast oEmbed path for YouTube, Vimeo, TikTok, SoundCloud
  try {
    let oembedUrl = '';
    let extractor = 'Web';
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      extractor = 'Youtube';
    } else if (host.includes('vimeo.com')) {
      oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
      extractor = 'Vimeo';
    } else if (host.includes('tiktok.com')) {
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      extractor = 'TikTok';
    } else if (host.includes('soundcloud.com')) {
      oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      extractor = 'SoundCloud';
    }

    if (oembedUrl) {
      const res = await fetch(oembedUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || 'Downloaded Media',
          thumbnail: data.thumbnail_url || null,
          duration: null,
          extractor,
          uploader: data.author_name || null,
          webpageUrl: url,
        };
      }
    }
  } catch {
    // Fall through to yt-dlp
  }

  const ytDlp = getYtDlpPath();
  const { stdout } = await execFileAsync(
    ytDlp,
    ['--dump-single-json', '--no-playlist', '--no-warnings', '--js-runtimes', 'node', url],
    {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  const data = JSON.parse(stdout);
  return {
    title: data.title || 'Downloaded Video',
    thumbnail: data.thumbnail || null,
    duration: typeof data.duration === 'number' ? data.duration : null,
    extractor: data.extractor_key || data.extractor || 'Web',
    uploader: data.uploader || data.channel || null,
    webpageUrl: data.webpage_url || url,
  };
}

/**
 * Downloads a video (or audio) from any yt-dlp supported source into a temp directory.
 * Returns the downloaded file path and sanitized title.
 */
export async function downloadVideoWithYtDlp(options: {
  url: string;
  outputDir: string;
  fileId: string;
  maxHeight?: number;
  audioOnly?: boolean;
}): Promise<{ filePath: string; title: string; extractor: string }> {
  const { url, outputDir, fileId, maxHeight, audioOnly } = options;
  validatePublicVideoUrl(url);

  const ytDlp = getYtDlpPath();
  const ffmpegPath = await getFfmpegPath();

  const outputTemplate = path.join(outputDir, `${fileId}_src.%(ext)s`);

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '--js-runtimes',
    'node',
    '--print',
    'after_move:filepath',
    '--print',
    'title',
    '--print',
    'extractor_key',
    '-o',
    outputTemplate,
  ];

  if (ffmpegPath) {
    args.push('--ffmpeg-location', ffmpegPath);
  }

  if (audioOnly) {
    args.push('-f', 'bestaudio/best');
  } else if (maxHeight && maxHeight > 0) {
    args.push(
      '-f',
      `bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]/best`
    );
    args.push('--merge-output-format', 'mp4');
  } else {
    args.push('-f', 'bestvideo+bestaudio/best');
    args.push('--merge-output-format', 'mp4');
  }

  args.push(url);

  const { stdout } = await execFileAsync(ytDlp, args, {
    timeout: 5 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
  }).catch(async (err: any) => {
    // If yt-dlp binary is missing (e.g. Vercel serverless), try extracting og:video / <video> from HTML
    if (err?.code === 'ENOENT' || String(err?.message || '').includes('ENOENT')) {
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      };
      const pageRes = await fetch(url, { headers, redirect: 'follow' });
      const ct = (pageRes.headers.get('content-type') || '').toLowerCase();
      if (pageRes.ok && (ct.startsWith('video/') || ct.startsWith('audio/'))) {
        const buf = Buffer.from(await pageRes.arrayBuffer());
        const ext = ct.split('/')[1]?.split(';')[0] || (audioOnly ? 'mp3' : 'mp4');
        const outFile = path.join(outputDir, `${fileId}_src.${ext}`);
        fs.writeFileSync(outFile, buf);
        return { stdout: `downloaded-media\nDirect\n${outFile}` };
      }
      if (pageRes.ok && ct.includes('text/html')) {
        const html = await pageRes.text();
        const videoMatch =
          html.match(/<meta[^>]+property=["']og:video(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<(?:video|source)[^>]+src=["']([^"']+)["']/i);
        if (videoMatch?.[1]) {
          const mediaUrl = new URL(videoMatch[1], url).href;
          validatePublicVideoUrl(mediaUrl);
          const mediaRes = await fetch(mediaUrl, { headers, redirect: 'follow' });
          if (mediaRes.ok) {
            const buf = Buffer.from(await mediaRes.arrayBuffer());
            const outFile = path.join(outputDir, `${fileId}_src.mp4`);
            fs.writeFileSync(outFile, buf);
            return { stdout: `downloaded-media\nWeb\n${outFile}` };
          }
        }
      }
      throw new Error(
        'Platform URL downloading (YouTube, TikTok, Instagram) requires yt-dlp on a local/VPS host. Direct .mp4/.mp3 URLs and HTML embedded videos work on serverless.'
      );
    }
    throw err;
  });

  // Output lines from --print: title, extractor_key, after_move:filepath
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Find the actual downloaded file in outputDir matching `${fileId}_src`
  let downloadedPath = lines.find((line) => fs.existsSync(line)) || '';
  if (!downloadedPath) {
    const files = fs.readdirSync(outputDir).filter((f) => f.startsWith(`${fileId}_src`));
    if (files.length > 0) {
      downloadedPath = path.join(outputDir, files[0]);
    }
  }

  if (!downloadedPath || !fs.existsSync(downloadedPath)) {
    throw new Error('yt-dlp did not produce a downloaded media file');
  }

  const rawTitle = lines[0] && !fs.existsSync(lines[0]) ? lines[0] : 'downloaded-video';
  const extractor = lines[1] && !fs.existsSync(lines[1]) ? lines[1] : 'Web';
  const safeTitle = rawTitle.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 120) || 'downloaded-video';

  return {
    filePath: downloadedPath,
    title: safeTitle,
    extractor,
  };
}

export function formatYtDlpError(err: any): string {
  const msg = String(err?.stderr || err?.message || err || '');
  if (/drm|widevine|fairplay|encrypted/i.test(msg)) {
    return 'This media is DRM-protected or encrypted and cannot be downloaded without authorization.';
  }
  if (/private|sign in|login|cookies|authentication|members-only/i.test(msg)) {
    return 'This media is private or requires login/authorization and cannot be accessed publicly.';
  }
  return err?.message || 'Failed to download media from the provided URL.';
}

/**
 * Fetches an image buffer from a direct image URL, an HTML page (og:image / twitter:image / img),
 * or a media platform URL (via yt-dlp thumbnail fallback).
 */
export async function fetchImageFromUrl(url: string): Promise<{
  buffer: Buffer;
  fileName: string;
  sourceType: string;
}> {
  // Support data:image/... base64 URLs directly
  if (url.startsWith('data:image/')) {
    const match = url.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      const ext = match[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      return {
        buffer: Buffer.from(match[2], 'base64'),
        fileName: `pasted_image.${ext}`,
        sourceType: 'Data URI',
      };
    }
  }

  let parsed = validatePublicVideoUrl(url);

  // Unwrap Google Images / Bing redirect URLs (e.g. ?imgurl=https://...)
  const nestedImgUrl =
    parsed.searchParams.get('imgurl') ||
    parsed.searchParams.get('mediaurl') ||
    parsed.searchParams.get('url');
  if (nestedImgUrl && /^https?:\/\//i.test(nestedImgUrl)) {
    url = nestedImgUrl;
    parsed = validatePublicVideoUrl(url);
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  };

  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${res.status}`);
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.startsWith('image/')) {
    const bytes = await res.arrayBuffer();
    const ext = contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'png';
    const rawName = path.basename(parsed.pathname) || `image.${ext}`;
    return {
      buffer: Buffer.from(bytes),
      fileName: rawName.includes('.') ? rawName : `${rawName}.${ext}`,
      sourceType: 'Direct Image',
    };
  }

  if (contentType.includes('text/html')) {
    const html = await res.text();
    const candidates: string[] = [];

    const metaPatterns = [
      /<meta[^>]+(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["']/gi,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image|twitter:image:src)["']/gi,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi,
      /"image"\s*:\s*"(https?:[^"]+)"/gi,
    ];

    for (const regex of metaPatterns) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) !== null) {
        if (match[1]) candidates.push(match[1].replace(/\\\//g, '/'));
      }
    }

    const imgAttrRegex = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgAttrRegex.exec(html)) !== null) {
      if (imgMatch[1] && !imgMatch[1].startsWith('data:')) {
        candidates.push(imgMatch[1]);
      }
    }

    for (const candidate of candidates) {
      try {
        const resolvedUrl = new URL(candidate, parsed.href).href;
        validatePublicVideoUrl(resolvedUrl);
        const imgRes = await fetch(resolvedUrl, { headers, redirect: 'follow' });
        const imgType = (imgRes.headers.get('content-type') || '').toLowerCase();
        if (imgRes.ok && imgType.startsWith('image/')) {
          const bytes = await imgRes.arrayBuffer();
          const ext = imgType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'jpg';
          const rawName = path.basename(new URL(resolvedUrl).pathname) || `extracted_image.${ext}`;
          return {
            buffer: Buffer.from(bytes),
            fileName: rawName.includes('.') ? rawName : `${rawName}.${ext}`,
            sourceType: 'Webpage Image',
          };
        }
      } catch {
        // Try next candidate
      }
    }
  } else {
    // Try treating non-HTML binary response (e.g. application/octet-stream) as an image
    try {
      const buf = Buffer.from(await res.arrayBuffer());
      const sharp = (await import('sharp')).default;
      const meta = await sharp(buf).metadata();
      if (meta.format) {
        const ext = meta.format === 'jpeg' ? 'jpg' : meta.format;
        const rawName = path.basename(parsed.pathname) || `image.${ext}`;
        return {
          buffer: buf,
          fileName: rawName.includes('.') ? rawName : `${rawName}.${ext}`,
          sourceType: 'Direct Image',
        };
      }
    } catch {
      // Not an image buffer
    }
  }

  // Fallback: try yt-dlp / oEmbed thumbnail for video/media pages
  try {
    const info = await fetchVideoInfo(url);
    if (info.thumbnail) {
      const thumbRes = await fetch(info.thumbnail, { headers, redirect: 'follow' });
      if (thumbRes.ok) {
        const bytes = await thumbRes.arrayBuffer();
        const safeTitle = info.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 80) || 'thumbnail';
        return {
          buffer: Buffer.from(bytes),
          fileName: `${safeTitle}.jpg`,
          sourceType: `${info.extractor} Thumbnail`,
        };
      }
    }
  } catch {
    // Ignore fallback failure
  }

  throw new Error('No downloadable public image was found at that URL.');
}
