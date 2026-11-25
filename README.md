# MediaConvert — All-in-One Media Converter & Downloader

A full-stack, local-first media conversion and multi-source downloading studio built with **Next.js 14**, **Three.js / WebGL**, **FFmpeg**, **yt-dlp**, **Sharp**, **PDF-Lib**, and **Tesseract.js**.

Convert local files or paste any public URL to download and transform videos, audio, images, PDFs, and OCR text — with an interactive 3D Kyoto temple background.

---

## Features

- **Video Downloader & Converter (`/video`)**
  - Paste URLs from **YouTube, TikTok, Instagram, X / Twitter, Vimeo, Reddit, Facebook**, or direct video links to preview metadata (thumbnail, title, duration) and download/convert.
  - Upload local videos and transcode between `MP4`, `MKV`, `MOV`, `AVI`, `WEBM`, and `GIF` with `2160p` (4K) to `360p` scaling, custom CRF quality, or audio track extraction.
- **Audio Extractor & Converter (`/audio`)**
  - Paste **any video or audio URL** (YouTube, SoundCloud, TikTok, Instagram, X, Vimeo, Reddit, or direct audio) to extract and download pure audio.
  - Convert local audio between `MP3`, `WAV`, `AAC`, `M4A`, `FLAC`, `OGG`, `OPUS`, and `WMA` up to `320 kbps` with trimming and waveform playback.
- **Image Downloader & Batch Converter (`/image`)**
  - Paste direct image URLs or webpage/video links to extract images/thumbnails, preview dimensions, resize, compress, and convert.
  - Batch upload and convert between `PNG`, `JPG`, `WEBP`, `AVIF`, `GIF`, `TIFF`, and `ICO`, with one-click ZIP archive download.
- **PDF Toolkit (`/pdf`)**
  - Merge multiple PDFs, split page ranges, rotate pages, add page numbers, and convert images to PDF.
- **OCR Text Extractor (`/ocr`)**
  - Extract selectable text from scanned images across multiple languages using Tesseract.js and export to `TXT` or `DOCX`.
- **Interactive 3D WebGL UI**
  - Custom Three.js sanctuary scene with falling maple leaves, vermilion moon, scroll-driven camera chapters on `/`, and continuous animated background on dedicated tool pages.
  - Responsive across desktop and mobile viewports.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling & Motion**: Tailwind CSS, Framer Motion, Lucide Icons, Three.js
- **Media & Document Engines**:
  - `yt-dlp` (multi-source URL extraction & downloading)
  - `fluent-ffmpeg` + `ffmpeg-static` (video & audio transcoding)
  - `sharp` (high-speed image conversion, resizing & compression)
  - `pdf-lib` & `pdf-parse` (PDF manipulation)
  - `tesseract.js` & `docx` (OCR & document export)

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python 3** with `yt-dlp` installed and available in `PATH`:
  ```bash
  pip install -U yt-dlp
  ```

### Installation

```bash
git clone https://github.com/imvengence17/Media-converter-downloader.git
cd Media-converter-downloader
npm install
```

### Development & Production

```bash
# Run development server
npm run dev

# Build and run production server
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```text
├── public/landing-pages/        # Interactive 3D Kage WebGL scene & assets
├── src/
│   ├── app/
│   │   ├── page.tsx             # Main landing page
│   │   ├── video/               # Video Downloader & Converter tab
│   │   ├── audio/               # Audio Extractor & Converter tab
│   │   ├── image/               # Image Downloader & Batch Converter tab
│   │   ├── pdf/                 # PDF Toolkit tab
│   │   ├── ocr/                 # OCR Text Extractor tab
│   │   └── api/                 # Conversion, metadata & download API routes
│   ├── components/              # Navbar, Footer, KageBackground, UI controls
│   └── lib/                     # yt-dlp, file-storage & utility helpers
└── package.json
```
