'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Link,
  Zap,
  Download,
  RotateCcw,
  Trash2,
  Clock,
  HardDrive,
  FileVideo,
  Music,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition, AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import FileUpload from '@/components/ui/FileUpload';
import ConversionProgress from '@/components/ui/ConversionProgress';
import FormatSelector from '@/components/ui/FormatSelector';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import {
  VIDEO_FORMATS,
  AUDIO_FORMATS,
  VIDEO_RESOLUTIONS,
  AUDIO_BITRATES,
  ConversionStatus,
} from '@/types';
import {
  cn,
  formatFileSize,
  formatDuration,
  truncateFilename,
  generateId,
  getFileExtension,
} from '@/lib/utils';

interface ConversionResult {
  id: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}

interface UrlVideoInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  extractor: string;
  uploader: string | null;
}

const SUPPORTED_SOURCES = [
  'YouTube',
  'TikTok',
  'Instagram',
  'X / Twitter',
  'Vimeo',
  'Reddit',
  'Facebook',
  'Direct MP4',
];

export default function VideoConverterPage() {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [urlInfo, setUrlInfo] = useState<UrlVideoInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);

  // Settings state
  const [outputFormat, setOutputFormat] = useState<string>(VIDEO_FORMATS[0]);
  const [resolution, setResolution] = useState<string>('1080');
  const [quality, setQuality] = useState(80);
  const [extractAudio, setExtractAudio] = useState(false);
  const [audioFormat, setAudioFormat] = useState<string>(AUDIO_FORMATS[0]);
  const [audioBitrate, setAudioBitrate] = useState<string>(AUDIO_BITRATES[0].value);

  // Conversion state
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History
  const { history, addItem, removeItem, clearHistory } = useConversionHistory();

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setVideoUrl('');
      setUrlInfo(null);
      setError(null);
      setResult(null);
      setStatus('idle');

      // Try to get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        setVideoDuration(null);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    } else {
      setSelectedFile(null);
      setVideoDuration(null);
    }
  }, []);

  const fetchUrlInfo = useCallback(async (targetUrl?: string) => {
    const urlToFetch = (targetUrl ?? videoUrl).trim();
    if (!urlToFetch) return;
    setFetchingInfo(true);
    setUrlInfo(null);
    try {
      const res = await fetch('/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not fetch video info');
      }
      setUrlInfo(data);
    } catch (err: any) {
      toast.error(err.message || 'Could not preview video URL');
    } finally {
      setFetchingInfo(false);
    }
  }, [videoUrl]);

  const handleUrlPaste = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    setUrlInfo(null);
    if (url) {
      setSelectedFile(null);
      setVideoDuration(null);
      setError(null);
      setResult(null);
      setStatus('idle');
    }
  }, []);

  const hasInput = selectedFile !== null || videoUrl.trim() !== '';

  const resetConversion = useCallback(() => {
    setSelectedFile(null);
    setVideoUrl('');
    setVideoDuration(null);
    setUrlInfo(null);
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setResult(null);
    setError(null);
  }, []);

  const startConversion = useCallback(async () => {
    if (!selectedFile && !videoUrl.trim()) {
      toast.error('Please select a file or paste a URL');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);
    setResult(null);
    setProgressMessage('Preparing upload...');

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('url', videoUrl.trim());
      }

      formData.append('outputFormat', extractAudio ? audioFormat.toLowerCase() : outputFormat.toLowerCase());
      formData.append('resolution', resolution);
      formData.append('quality', quality.toString());
      formData.append('extractAudio', extractAudio.toString());
      formData.append('audioBitrate', audioBitrate);
      formData.append('audioFormat', audioFormat.toLowerCase());

      setProgressMessage('Uploading file...');
      setProgress(10);

      // Simulate upload progress for large files
      const uploadTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 40) {
            clearInterval(uploadTimer);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      const response = await fetch('/api/convert/video', {
        method: 'POST',
        body: formData,
      });

      clearInterval(uploadTimer);
      setStatus('processing');
      setProgress(50);
      setProgressMessage('Converting video...');

      // Simulate processing progress
      const processTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(processTimer);
            return prev;
          }
          return prev + 3;
        });
      }, 500);

      const data = await response.json();

      clearInterval(processTimer);

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setProgress(100);
      setStatus('completed');
      setProgressMessage('Conversion complete!');
      setResult(data);

      // Add to history
      addItem({
        id: data.id,
        type: 'video',
        inputFileName: selectedFile?.name || videoUrl,
        outputFileName: data.fileName,
        outputFormat: extractAudio ? audioFormat : outputFormat,
        fileSize: data.fileSize,
        convertedAt: new Date().toISOString(),
        downloadUrl: data.downloadUrl,
      });

      toast.success('Video converted successfully!');
    } catch (err) {
      setStatus('error');
      setProgress(0);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setProgressMessage('');
      toast.error(errorMessage);
    }
  }, [selectedFile, videoUrl, outputFormat, resolution, quality, extractAudio, audioFormat, audioBitrate, addItem]);

  const handleDownload = useCallback(() => {
    if (result?.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    }
  }, [result]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-transparent pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Header */}
          <AnimatedSection>
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-primary/20 to-pink-primary/5 dark:from-pink-primary/30 dark:to-pink-primary/10 mb-4"
              >
                <Video className="w-8 h-8 text-pink-primary" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3">
                Video Downloader & Converter
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                Download videos from YouTube, TikTok, Instagram, X, Vimeo, Reddit & more — or upload local files to convert formats, resize resolution, and extract audio.
              </p>
            </div>
          </AnimatedSection>

          {/* URL Input */}
          <AnimatedSection delay={0.1}>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={handleUrlPaste}
                    placeholder="Paste video URL (YouTube, TikTok, Instagram, X, Vimeo, Reddit, or direct MP4)"
                    disabled={status === 'uploading' || status === 'processing'}
                    className="input-field pl-12 w-full"
                  />
                </div>
                {videoUrl.trim() && (
                  <button
                    type="button"
                    onClick={() => fetchUrlInfo()}
                    disabled={fetchingInfo || status === 'uploading' || status === 'processing'}
                    className="btn-secondary whitespace-nowrap px-5 py-3 text-sm disabled:opacity-50"
                  >
                    {fetchingInfo ? 'Fetching...' : 'Preview Info'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 mr-1">
                  Supported Sources:
                </span>
                {SUPPORTED_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-white/5 border border-white/10 text-gray-300"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* URL Info Card */}
          {!selectedFile && videoUrl.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 sm:p-5 mb-6"
            >
              <div className="flex items-start gap-4">
                {urlInfo?.thumbnail ? (
                  <img
                    src={urlInfo.thumbnail}
                    alt={urlInfo.title}
                    className="w-24 h-16 sm:w-28 sm:h-18 rounded-xl object-cover flex-shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#e0231c]/15 border border-[#e0231c]/30 flex items-center justify-center flex-shrink-0">
                    <Link className="w-6 h-6 text-[#e0231c]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {urlInfo?.title || 'Remote Video URL'}
                    </h3>
                    {urlInfo?.extractor && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#e0231c]/20 text-[#ff6f68] border border-[#e0231c]/30">
                        {urlInfo.extractor}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {urlInfo?.uploader ? `${urlInfo.uploader} · ` : ''}
                    {videoUrl}
                  </p>
                  {urlInfo?.duration != null && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(urlInfo.duration)}
                    </span>
                  )}
                </div>
                <button
                  onClick={resetConversion}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* File Upload */}
          <AnimatedSection delay={0.15}>
            <div className="mb-8">
              <FileUpload
                accept="video/*"
                maxSize={500 * 1024 * 1024}
                onFilesSelected={handleFilesSelected}
                label="Upload Video"
                description="Drag and drop your video file here, or click to browse"
                showPreview={false}
                disabled={status === 'uploading' || status === 'processing'}
              />
            </div>
          </AnimatedSection>

          {/* File Info & Settings */}
          <AnimatePresence mode="wait">
            {hasInput && status !== 'completed' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* File Info Card */}
                {selectedFile && (
                  <div className="glass-card p-5 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileVideo className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-navy-900 dark:text-white truncate">
                          {truncateFilename(selectedFile.name, 50)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <HardDrive className="w-3.5 h-3.5" />
                            {formatFileSize(selectedFile.size)}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <FileVideo className="w-3.5 h-3.5" />
                            {selectedFile.type || 'video'}
                          </span>
                          {videoDuration !== null && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(videoDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={resetConversion}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Conversion Settings */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-5">
                      Conversion Settings
                    </h3>

                    <div className="space-y-5">
                      {/* Extract Audio Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-navy-900/30 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <Music className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-navy-900 dark:text-white">
                              Extract Audio Only
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Extract the audio track from the video
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExtractAudio(!extractAudio)}
                          disabled={status === 'uploading' || status === 'processing'}
                          className={cn(
                            'relative w-12 h-7 rounded-full transition-colors duration-200',
                            extractAudio
                              ? 'bg-pink-primary'
                              : 'bg-gray-300 dark:bg-gray-600'
                          )}
                        >
                          <motion.div
                            animate={{ x: extractAudio ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                          />
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {extractAudio ? (
                          /* Audio Extraction Settings */
                          <motion.div
                            key="audio-settings"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          >
                            <FormatSelector
                              formats={[...AUDIO_FORMATS]}
                              value={audioFormat}
                              onChange={setAudioFormat}
                              label="Audio Format"
                              disabled={status === 'uploading' || status === 'processing'}
                            />

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-navy-900 dark:text-gray-300">
                                Audio Bitrate
                              </label>
                              <div className="relative">
                                <select
                                  value={audioBitrate}
                                  onChange={(e) => setAudioBitrate(e.target.value)}
                                  disabled={status === 'uploading' || status === 'processing'}
                                  className={cn(
                                    'w-full px-4 py-3 pr-10 bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-gray-700 rounded-xl',
                                    'text-navy-900 dark:text-white font-medium text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-pink-primary/50 focus:border-pink-primary',
                                    'appearance-none cursor-pointer transition-all duration-200',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                  )}
                                >
                                  {AUDIO_BITRATES.map((br) => (
                                    <option key={br.value} value={br.value}>
                                      {br.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          /* Video Conversion Settings */
                          <motion.div
                            key="video-settings"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          >
                            <FormatSelector
                              formats={[...VIDEO_FORMATS]}
                              value={outputFormat}
                              onChange={setOutputFormat}
                              label="Output Format"
                              disabled={status === 'uploading' || status === 'processing'}
                            />

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-navy-900 dark:text-gray-300">
                                Resolution
                              </label>
                              <div className="relative">
                                <select
                                  value={resolution}
                                  onChange={(e) => setResolution(e.target.value)}
                                  disabled={status === 'uploading' || status === 'processing'}
                                  className={cn(
                                    'w-full px-4 py-3 pr-10 bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-gray-700 rounded-xl',
                                    'text-navy-900 dark:text-white font-medium text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-pink-primary/50 focus:border-pink-primary',
                                    'appearance-none cursor-pointer transition-all duration-200',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                  )}
                                >
                                  {VIDEO_RESOLUTIONS.map((res) => (
                                    <option key={res.value} value={res.value}>
                                      {res.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Quality Slider */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-navy-900 dark:text-gray-300">
                            Quality
                          </label>
                          <span className="text-sm font-mono font-semibold text-pink-primary">
                            {quality}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          disabled={status === 'uploading' || status === 'processing'}
                          className="w-full h-2 bg-gray-200 dark:bg-navy-800 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-primary
                            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-pink-primary [&::-moz-range-thumb]:border-0
                            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Smaller file</span>
                          <span>Higher quality</span>
                        </div>
                      </div>
                    </div>

                    {/* Convert Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startConversion}
                      disabled={status === 'uploading' || status === 'processing'}
                      className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-5 h-5" />
                      {videoUrl.trim() && !selectedFile
                        ? `Download & ${extractAudio ? 'Extract Audio' : 'Convert Video'}`
                        : `Convert ${extractAudio ? 'to Audio' : 'Video'}`}
                    </motion.button>
                  </div>

                {/* Conversion Progress */}
                {(status === 'uploading' || status === 'processing') && (
                  <AnimatedSection>
                    <div className="glass-card p-6 mb-6">
                      <ConversionProgress
                        progress={progress}
                        status={status}
                        message={progressMessage}
                      />
                    </div>
                  </AnimatedSection>
                )}

                {/* Error State */}
                {status === 'error' && error && (
                  <AnimatedSection>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-6 mb-6 border-red-200 dark:border-red-800/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <X className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                            Conversion Failed
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {error}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={startConversion}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retry
                        </button>
                        <button
                          onClick={resetConversion}
                          className="btn-outline text-sm"
                        >
                          Start Over
                        </button>
                      </div>
                    </motion.div>
                  </AnimatedSection>
                )}
              </motion.div>
            )}

            {/* Success State */}
            {status === 'completed' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <AnimatedSection>
                  <div className="glass-card p-6 mb-6 border-green-200 dark:border-green-800/50">
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4"
                      >
                        <Check className="w-8 h-8 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                        Conversion Complete!
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Your file is ready to download
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-navy-900/30 border border-gray-200 dark:border-gray-700 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          {extractAudio ? (
                            <Music className="w-5 h-5 text-green-500" />
                          ) : (
                            <FileVideo className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy-900 dark:text-white">
                            {truncateFilename(result.fileName, 40)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(result.fileSize)}
                          </p>
                        </div>
                      </div>
                      <span className="format-badge text-xs font-semibold">
                        {getFileExtension(result.fileName).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download File
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetConversion}
                        className="btn-outline flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Convert Another
                      </motion.button>
                    </div>
                  </div>
                </AnimatedSection>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversion History */}
          <AnimatedSection delay={0.2}>
            {history.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="section-heading text-xl">Conversion History</h2>
                  <button
                    onClick={clearHistory}
                    className="btn-ghost text-xs flex items-center gap-1.5 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>

                <StaggerContainer className="space-y-3">
                  {history
                    .filter((item) => item.type === 'video')
                    .slice(0, 10)
                    .map((item) => (
                      <StaggerItem key={item.id}>
                        <div className="glass-card p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <FileVideo className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy-900 dark:text-white truncate">
                              {truncateFilename(item.inputFileName, 35)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                → {item.outputFormat.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(item.fileSize)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.convertedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.downloadUrl && (
                              <a
                                href={item.downloadUrl}
                                download
                                className="p-2 rounded-lg hover:bg-pink-primary/10 text-gray-400 hover:text-pink-primary transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                </StaggerContainer>
              </div>
            )}
          </AnimatedSection>
        </div>
      </div>
    </PageTransition>
  );
}
