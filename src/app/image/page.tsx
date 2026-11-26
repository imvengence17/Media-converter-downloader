'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Palette,
  Minimize2,
  FileDown,
  Download,
  PackageOpen,
  Trash2,
  ArrowRight,
  Link2,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition, AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import FileUpload from '@/components/ui/FileUpload';
import FormatSelector from '@/components/ui/FormatSelector';
import ConversionProgress from '@/components/ui/ConversionProgress';
import { IMAGE_FORMATS } from '@/types';
import type { ConversionStatus } from '@/types';
import { cn, formatFileSize, truncateFilename, generateId } from '@/lib/utils';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
}

interface ConvertedFile {
  id: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  width: number;
  height: number;
}

const QUICK_TOOLS = [
  {
    id: 'convert',
    icon: Palette,
    title: 'Convert Format',
    description: 'Change image format (PNG, JPG, WebP, AVIF, etc.)',
    color: 'from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20',
    iconColor: 'text-pink-500',
  },
  {
    id: 'compress',
    icon: Minimize2,
    title: 'Compress Image',
    description: 'Reduce file size while maintaining quality',
    color: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
    iconColor: 'text-blue-500',
  },
  {
    id: 'resize',
    icon: FileDown,
    title: 'Resize Image',
    description: 'Change dimensions to any width and height',
    color: 'from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20',
    iconColor: 'text-green-500',
  },
];

export default function ImageConverterPage() {
  // Uploaded files state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fetchingUrl, setFetchingUrl] = useState<boolean>(false);
  const [urlPreview, setUrlPreview] = useState<{
    fileName: string;
    sourceType: string;
    width: number;
    height: number;
    fileSize: number;
    preview: string;
  } | null>(null);

  // Conversion settings
  const [outputFormat, setOutputFormat] = useState<string>('PNG');
  const [quality, setQuality] = useState<number>(85);
  const [enableResize, setEnableResize] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [enableCompress, setEnableCompress] = useState(false);

  // Conversion state
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);

  // Refs for scrolling
  const uploadRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle file selection
  const handleFilesSelected = useCallback(async (files: File[]) => {
    setSelectedFiles(files);
    setConvertedFiles([]);
    setStatus('idle');
    setProgress(0);

    const newImages: UploadedImage[] = [];

    for (const file of files) {
      const preview = await readFileAsDataUrl(file);
      const dimensions = await getImageDimensions(preview);
      newImages.push({
        id: generateId(),
        file,
        preview,
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    setUploadedImages(newImages);

    // Scroll to settings
    setTimeout(() => {
      settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, []);

  // Read file as data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Get image dimensions from data URL
  const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = dataUrl;
    });
  };

  // Remove a single uploaded image
  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    const remaining = uploadedImages.filter((img) => img.id !== id);
    setSelectedFiles(remaining.map((img) => img.file));
    if (remaining.length === 0) {
      setConvertedFiles([]);
      setStatus('idle');
    }
  };

  // Clear all uploaded images
  const clearAll = () => {
    setUploadedImages([]);
    setSelectedFiles([]);
    setImageUrl('');
    setUrlPreview(null);
    setConvertedFiles([]);
    setStatus('idle');
    setProgress(0);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setImageUrl(val);
    setUrlPreview(null);
    if (val) {
      setUploadedImages([]);
      setSelectedFiles([]);
      setConvertedFiles([]);
      setStatus('idle');
    }
  };

  const handleFetchImageUrl = async () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    setFetchingUrl(true);
    setUrlPreview(null);
    try {
      const res = await fetch('/api/image/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not fetch image from URL');
      setUrlPreview(data);
    } catch (err: any) {
      toast.error(err.message || 'Could not fetch image from URL');
    } finally {
      setFetchingUrl(false);
    }
  };

  // Scroll to section
  const scrollToSection = (id: string) => {
    if (id === 'convert' || id === 'compress' || id === 'resize') {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (id === 'compress') {
        setEnableCompress(true);
        setQuality(60);
      }
      if (id === 'resize') {
        setEnableResize(true);
      }
    }
  };

  // Convert images
  const handleConvert = async () => {
    if (uploadedImages.length === 0 && !imageUrl.trim()) {
      toast.error('Please upload an image or paste an image/webpage URL');
      return;
    }

    const fmt = outputFormat.toLowerCase();
    if (fmt === 'svg') {
      toast.error('Cannot convert raster images to SVG format');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setProgressMessage(uploadedImages.length > 0 ? 'Preparing files for upload...' : 'Fetching image from URL...');
    setConvertedFiles([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();

      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          formData.append('files', img.file);
        }
      } else {
        formData.append('url', imageUrl.trim());
      }

      formData.append('outputFormat', fmt);
      formData.append('quality', quality.toString());

      if (enableResize) {
        if (resizeWidth) formData.append('width', resizeWidth);
        if (resizeHeight) formData.append('height', resizeHeight);
        formData.append('maintainAspectRatio', maintainAspectRatio.toString());
      }

      if (enableCompress) {
        formData.append('enableCompress', 'true');
      }

      setStatus('processing');
      setProgress(20);
      setProgressMessage(`Converting ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}...`);

      const response = await fetch('/api/convert/image', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      setProgress(80);
      setProgressMessage('Processing results...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(errorData.error || 'Conversion failed');
      }

      const data = await response.json();

      setConvertedFiles(data.files);
      setStatus('completed');
      setProgress(100);
      setProgressMessage('All images converted successfully!');
      toast.success(`${data.files.length} image${data.files.length > 1 ? 's' : ''} converted successfully!`);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStatus('cancelled');
        setProgressMessage('Conversion was cancelled');
        toast.info('Conversion cancelled');
      } else {
        setStatus('error');
        setProgressMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        toast.error(error instanceof Error ? error.message : 'Conversion failed');
      }
    }
  };

  // Cancel conversion
  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  // Retry conversion
  const handleRetry = () => {
    handleConvert();
  };

  // Download single file
  const handleDownload = async (file: ConvertedFile) => {
    try {
      const response = await fetch(file.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${file.fileName}`);
    } catch {
      toast.error('Download failed');
    }
  };

  // Download all as ZIP
  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) return;

    toast.info('Creating ZIP archive...');
    try {
      const ids = convertedFiles.map((f) => f.id).join(',');
      const response = await fetch(`/api/convert/image?zip=true&ids=${encodeURIComponent(ids)}&format=${outputFormat.toLowerCase()}`);

      if (!response.ok) {
        throw new Error('Failed to create ZIP');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-images-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('ZIP archive downloaded!');
    } catch {
      toast.error('Failed to download ZIP');
    }
  };

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <PageTransition>
      <div className="min-h-screen bg-transparent">
        {/* Hero Header */}
        <section className="relative overflow-hidden pt-24 pb-10 md:pt-28 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-primary/20 to-pink-primary/5 mb-4">
                <ImageIcon className="w-8 h-8 text-pink-primary" />
              </div>
              <h1 className="section-heading">
                <span className="gradient-text">Image Converter</span>
              </h1>
              <p className="section-subheading mx-auto">
                Convert, resize, and compress images in any format
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Quick Tool Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {QUICK_TOOLS.map((tool) => (
              <StaggerItem key={tool.id}>
                <motion.button
                  onClick={() => scrollToSection(tool.id)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left glass-card p-6 group"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110',
                    tool.color
                  )}>
                    <tool.icon className={cn('w-6 h-6', tool.iconColor)} />
                  </div>
                  <h3 className="font-semibold text-navy-900 dark:text-white mb-1 flex items-center gap-2">
                    {tool.title}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tool.description}
                  </p>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* URL Input Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="Paste image URL or webpage/video link (Direct PNG/JPG/WebP, YouTube thumbnail, article, etc.)"
                  disabled={isProcessing}
                  className="input-field pl-12 w-full"
                />
              </div>
              {imageUrl.trim() && (
                <button
                  type="button"
                  onClick={handleFetchImageUrl}
                  disabled={fetchingUrl || isProcessing}
                  className="btn-secondary whitespace-nowrap px-5 py-3 text-sm disabled:opacity-50"
                >
                  {fetchingUrl ? 'Fetching...' : 'Preview Image'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 mr-1">
                Supported Sources:
              </span>
              {['Direct Image', 'Webpage / Article', 'YouTube Thumbnail', 'Pinterest', 'Unsplash', 'Reddit'].map((source) => (
                <span
                  key={source}
                  className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-white/5 border border-white/10 text-gray-300"
                >
                  {source}
                </span>
              ))}
            </div>

            {!uploadedImages.length && imageUrl.trim() && (
              <div className="glass-card p-4 sm:p-5 flex items-center gap-4">
                {urlPreview?.preview ? (
                  <img
                    src={urlPreview.preview}
                    alt={urlPreview.fileName}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#e0231c]/15 border border-[#e0231c]/30 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-6 h-6 text-[#e0231c]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {urlPreview?.fileName || 'Remote Image URL'}
                    </p>
                    {urlPreview?.sourceType && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#e0231c]/20 text-[#ff6f68] border border-[#e0231c]/30">
                        {urlPreview.sourceType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{imageUrl}</p>
                  {urlPreview && (
                    <p className="text-xs text-gray-400 mt-1">
                      {urlPreview.width}×{urlPreview.height}px · {formatFileSize(urlPreview.fileSize)}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearAll}
                  className="p-2 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Upload Section */}
        <section ref={uploadRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <AnimatedSection>
            <FileUpload
              accept="image/*"
              multiple
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              label="Upload Images"
              description="Drag and drop images here, or click to browse. Supports PNG, JPG, WebP, GIF, BMP, TIFF, AVIF"
              showPreview={false}
              disabled={isProcessing}
            />
          </AnimatedSection>
        </section>

        {/* Image Previews Grid */}
        <AnimatePresence>
          {uploadedImages.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                  Uploaded Images ({uploadedImages.length})
                </h3>
                <button onClick={clearAll} className="btn-ghost text-sm text-red-500 hover:text-red-600 gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((img, index) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card overflow-hidden group"
                  >
                    <div className="relative aspect-square bg-gray-100 dark:bg-navy-800 overflow-hidden">
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate text-navy-900 dark:text-white">
                        {truncateFilename(img.file.name, 25)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{img.width} × {img.height}</span>
                        <span>•</span>
                        <span>{formatFileSize(img.file.size)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Conversion Settings */}
        <AnimatePresence>
          {(uploadedImages.length > 0 || imageUrl.trim() !== '') && (
            <motion.section
              ref={settingsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
            >
              <div className="glass-card p-6 md:p-8 space-y-8">
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                  Conversion Settings
                </h3>

                {/* Output Format */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormatSelector
                    formats={IMAGE_FORMATS.filter((f) => f !== 'SVG')}
                    value={outputFormat}
                    onChange={setOutputFormat}
                    label="Output Format"
                    disabled={isProcessing}
                  />

                  {/* Quality Slider */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-navy-900 dark:text-gray-300">
                      Quality: {quality}%
                    </label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        disabled={isProcessing}
                        className="w-full h-2 bg-gray-200 dark:bg-navy-800 rounded-full appearance-none cursor-pointer accent-pink-primary disabled:opacity-50"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Low (1)</span>
                        <span>Default (85)</span>
                        <span>Max (100)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resize Toggle */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={enableResize}
                        onChange={(e) => setEnableResize(e.target.checked)}
                        disabled={isProcessing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-navy-800 rounded-full peer peer-checked:bg-pink-primary transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm font-medium text-navy-900 dark:text-gray-300">
                      Resize Image
                    </span>
                  </label>

                  <AnimatePresence>
                    {enableResize && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-14">
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Width (px)</label>
                            <input
                              type="number"
                              value={resizeWidth}
                              onChange={(e) => setResizeWidth(e.target.value)}
                              placeholder="e.g., 1920"
                              className="input-field"
                              disabled={isProcessing}
                              min={1}
                              max={10000}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Height (px)</label>
                            <input
                              type="number"
                              value={resizeHeight}
                              onChange={(e) => setResizeHeight(e.target.value)}
                              placeholder="e.g., 1080"
                              className="input-field"
                              disabled={isProcessing}
                              min={1}
                              max={10000}
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 mt-3 pl-14 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={maintainAspectRatio}
                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded border-gray-300 text-pink-primary focus:ring-pink-primary"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            Maintain aspect ratio
                          </span>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Compress Toggle */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={enableCompress}
                        onChange={(e) => setEnableCompress(e.target.checked)}
                        disabled={isProcessing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-navy-800 rounded-full peer peer-checked:bg-pink-primary transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm font-medium text-navy-900 dark:text-gray-300">
                      Compress for smaller file size
                    </span>
                  </label>

                  <AnimatePresence>
                    {enableCompress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400 pl-14">
                          The quality slider above controls compression level. Lower quality = smaller file size.
                          Recommended: 60-75% for web images.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Convert Button */}
                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConvert}
                    disabled={isProcessing || (uploadedImages.length === 0 && !imageUrl.trim())}
                    className="btn-primary text-base px-8 py-3.5"
                  >
                    {isProcessing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <RotateCcw className="w-5 h-5" />
                        </motion.div>
                        Converting...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        {imageUrl.trim() && uploadedImages.length === 0
                          ? 'Download & Convert Image'
                          : `Convert ${uploadedImages.length > 1 ? `All ${uploadedImages.length} Images` : 'Image'}`}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Conversion Progress */}
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
            >
              <div className="glass-card p-6">
                <ConversionProgress
                  progress={progress}
                  status={status}
                  message={progressMessage}
                  onCancel={isProcessing ? handleCancel : undefined}
                  onRetry={status === 'error' || status === 'cancelled' ? handleRetry : undefined}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Converted Results */}
        <AnimatePresence>
          {convertedFiles.length > 0 && (
            <motion.section
              ref={resultsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Converted Images ({convertedFiles.length})
                </h3>

                {convertedFiles.length > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadAll}
                    className="btn-secondary text-sm"
                  >
                    <PackageOpen className="w-4 h-4" />
                    Download All as ZIP
                  </motion.button>
                )}
              </div>

              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {convertedFiles.map((file) => (
                  <StaggerItem key={file.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="glass-card overflow-hidden group"
                    >
                      <div className="relative aspect-square bg-gray-100 dark:bg-navy-800 overflow-hidden">
                        <img
                          src={file.downloadUrl}
                          alt={file.fileName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleDownload(file)}
                            className="p-3 rounded-full bg-white/90 dark:bg-navy-900/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="w-5 h-5 text-pink-primary" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate text-navy-900 dark:text-white">
                          {truncateFilename(file.fileName, 25)}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{file.width} × {file.height}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.fileSize)}</span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownload(file)}
                          className="w-full mt-3 btn-primary text-xs py-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </motion.button>
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {uploadedImages.length === 0 && !imageUrl.trim() && status === 'idle' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <AnimatedSection delay={0.3}>
              <div className="glass-card p-8 md:p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-navy-800 dark:to-navy-900 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                    No images uploaded yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload one or more images above to get started. We support batch processing for converting multiple images at once.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {['PNG', 'JPG', 'WEBP', 'AVIF', 'GIF', 'TIFF', 'BMP', 'ICO'].map((fmt) => (
                      <span key={fmt} className="format-badge">{fmt}</span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
