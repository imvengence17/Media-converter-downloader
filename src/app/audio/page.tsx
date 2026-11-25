'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileAudio,
  Play,
  Pause,
  Download,
  Scissors,
  Sliders,
  RotateCcw,
  Volume2,
  Clock,
  HardDrive,
  Trash2,
  Check,
  X,
  Zap,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition, AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import FileUpload from '@/components/ui/FileUpload';
import FormatSelector from '@/components/ui/FormatSelector';
import ConversionProgress from '@/components/ui/ConversionProgress';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { AUDIO_FORMATS, AUDIO_BITRATES } from '@/types';
import type { ConversionStatus } from '@/types';
import { cn, formatFileSize, formatDuration, truncateFilename } from '@/lib/utils';

interface ConversionResult {
  id: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}

interface UrlMediaInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  extractor: string;
  uploader: string | null;
}

const AUDIO_SUPPORTED_SOURCES = [
  'YouTube',
  'SoundCloud',
  'TikTok',
  'Instagram',
  'X / Twitter',
  'Vimeo',
  'Reddit',
  'Direct MP3 / WAV',
];

export default function AudioConverterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlInfo, setUrlInfo] = useState<UrlMediaInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Conversion settings
  const [outputFormat, setOutputFormat] = useState<string>('MP3');
  const [bitrate, setBitrate] = useState<string>('320k');
  const [enableTrim, setEnableTrim] = useState(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  // Conversion states
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ConversionResult | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { history, addItem, removeItem, clearHistory } = useConversionHistory();

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setSourceUrl('');
      setUrlInfo(null);
      setResult(null);
      setStatus('idle');

      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      const tempAudio = new Audio(url);
      tempAudio.onloadedmetadata = () => {
        setDuration(tempAudio.duration);
        setTrimEnd(Math.floor(tempAudio.duration));
      };
    } else {
      setSelectedFile(null);
      setAudioUrl(null);
      setDuration(0);
    }
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSourceUrl(val);
    setUrlInfo(null);
    if (val) {
      setSelectedFile(null);
      setAudioUrl(null);
      setResult(null);
      setStatus('idle');
    }
  };

  const fetchUrlInfo = async () => {
    const trimmed = sourceUrl.trim();
    if (!trimmed) return;
    setFetchingInfo(true);
    setUrlInfo(null);
    try {
      const res = await fetch('/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not fetch media info');
      setUrlInfo(data);
      if (typeof data.duration === 'number') {
        setDuration(data.duration);
        setTrimEnd(Math.floor(data.duration));
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not preview URL');
    } finally {
      setFetchingInfo(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleConvert = async () => {
    if (!selectedFile && !sourceUrl.trim()) {
      toast.error('Please select an audio file or paste a video/audio URL');
      return;
    }

    setStatus('uploading');
    setProgress(15);
    setProgressMessage(selectedFile ? 'Uploading audio file...' : 'Fetching & extracting audio from URL...');

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('url', sourceUrl.trim());
      }
      formData.append('outputFormat', outputFormat.toLowerCase());
      formData.append('bitrate', bitrate);

      if (enableTrim) {
        formData.append('trimStart', trimStart.toString());
        formData.append('trimEnd', trimEnd.toString());
      }

      setProgress(45);
      setStatus('processing');
      setProgressMessage(`Transcoding to ${outputFormat.toUpperCase()} at ${bitrate}...`);

      const response = await fetch('/api/convert/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audio conversion failed');
      }

      setProgress(100);
      const data: ConversionResult = await response.json();
      setResult(data);
      setStatus('completed');
      setProgressMessage('Conversion completed successfully!');
      toast.success(`Converted to ${outputFormat.toUpperCase()}!`);

      addItem({
        id: data.id,
        type: 'audio',
        inputFileName: selectedFile?.name || urlInfo?.title || sourceUrl.trim(),
        outputFileName: data.fileName,
        outputFormat: outputFormat.toLowerCase(),
        fileSize: data.fileSize,
        convertedAt: new Date().toISOString(),
        downloadUrl: data.downloadUrl,
      });
    } catch (err: any) {
      setStatus('error');
      setProgressMessage(err.message || 'Conversion failed');
      toast.error(err.message || 'Conversion failed');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSourceUrl('');
    setUrlInfo(null);
    setAudioUrl(null);
    setResult(null);
    setStatus('idle');
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <PageTransition className="min-h-screen pt-24 pb-16 bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <AnimatedSection className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 mb-2">
            <FileAudio className="w-8 h-8" />
          </div>
          <h1 className="section-heading">
            Audio <span className="gradient-text">Extractor & Converter</span>
          </h1>
          <p className="section-subheading mx-auto">
            Paste any video or audio URL (YouTube, SoundCloud, TikTok, Instagram, X) to extract and download audio — or upload local audio files to convert and trim.
          </p>
        </AnimatedSection>

        {/* URL Input */}
        <AnimatedSection delay={0.05}>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={handleUrlChange}
                  placeholder="Paste video or audio URL (YouTube, SoundCloud, TikTok, Instagram, direct MP3)"
                  disabled={status === 'uploading' || status === 'processing'}
                  className="input-field pl-12 w-full"
                />
              </div>
              {sourceUrl.trim() && (
                <button
                  type="button"
                  onClick={fetchUrlInfo}
                  disabled={fetchingInfo || status === 'uploading' || status === 'processing'}
                  className="btn-secondary whitespace-nowrap px-5 py-3 text-sm disabled:opacity-50"
                >
                  {fetchingInfo ? 'Fetching...' : 'Preview Info'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 mr-1">
                Supported Sources:
              </span>
              {AUDIO_SUPPORTED_SOURCES.map((source) => (
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

        {/* Upload / URL Settings Card */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card p-6 md:p-8">
            {!selectedFile && !sourceUrl.trim() ? (
              <FileUpload
                accept="audio/*,.mp3,.wav,.aac,.m4a,.flac,.ogg,.wma,.opus"
                maxSize={500 * 1024 * 1024}
                onFilesSelected={handleFilesSelected}
                label="Choose an audio file or drag & drop"
                description="Supports MP3, WAV, AAC, M4A, FLAC, OGG, WMA, OPUS up to 500MB"
              />
            ) : (
              <div className="space-y-6">
                {selectedFile ? (
                  /* Audio Info & Player Bar */
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-navy-900/70 border border-gray-200 dark:border-gray-800 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-primary to-pink-light text-white flex items-center justify-center shadow-glow hover:scale-105 transition-all"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <div>
                          <p className="font-semibold text-navy-900 dark:text-white truncate max-w-sm">
                            {truncateFilename(selectedFile.name, 35)}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3.5 h-3.5" />
                              {formatFileSize(selectedFile.size)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {duration > 0 ? formatDuration(duration) : 'Loading...'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors self-end sm:self-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Choose another
                      </button>
                    </div>

                    {audioUrl && (
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleAudioEnded}
                        className="hidden"
                      />
                    )}

                    {/* Scrubber */}
                    <div className="space-y-1.5">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full accent-pink-primary cursor-pointer h-1.5 bg-gray-200 dark:bg-navy-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(duration)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* URL Info Card */
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-4">
                    {urlInfo?.thumbnail ? (
                      <img
                        src={urlInfo.thumbnail}
                        alt={urlInfo.title}
                        className="w-24 h-16 rounded-xl object-cover flex-shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#e0231c]/15 border border-[#e0231c]/30 flex items-center justify-center flex-shrink-0">
                        <Link2 className="w-6 h-6 text-[#e0231c]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white truncate">
                          {urlInfo?.title || 'Remote Media URL (Audio Extraction)'}
                        </p>
                        {urlInfo?.extractor && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#e0231c]/20 text-[#ff6f68] border border-[#e0231c]/30">
                            {urlInfo.extractor}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {urlInfo?.uploader ? `${urlInfo.uploader} · ` : ''}
                        {sourceUrl}
                      </p>
                      {urlInfo?.duration != null && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(urlInfo.duration)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  </div>
                )}

                {/* Conversion Configuration Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <FormatSelector
                    label="Output Format"
                    formats={AUDIO_FORMATS}
                    value={outputFormat}
                    onChange={setOutputFormat}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-navy-900 dark:text-gray-300">
                      Bitrate Quality
                    </label>
                    <select
                      value={bitrate}
                      onChange={(e) => setBitrate(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      {AUDIO_BITRATES.map((rate) => (
                        <option key={rate.value} value={rate.value}>
                          {rate.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Audio Trimmer Feature */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-navy-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-pink-primary" />
                      <span className="text-sm font-semibold text-navy-900 dark:text-white">
                        Trim Audio
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableTrim}
                        onChange={(e) => setEnableTrim(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-primary"></div>
                    </label>
                  </div>

                  {enableTrim && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-2 gap-4 pt-2"
                    >
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Start Time (seconds)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={trimEnd}
                          value={trimStart}
                          onChange={(e) => setTrimStart(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          End Time (seconds)
                        </label>
                        <input
                          type="number"
                          min={trimStart}
                          max={Math.ceil(duration) || 3600}
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)}
                          className="input-field text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Progress Indicator */}
                {status !== 'idle' && (
                  <ConversionProgress
                    progress={progress}
                    status={status}
                    message={progressMessage}
                    onRetry={handleConvert}
                  />
                )}

                {/* Convert Button */}
                {status !== 'completed' && (
                  <button
                    onClick={handleConvert}
                    disabled={status === 'uploading' || status === 'processing'}
                    className="w-full btn-primary text-base py-3.5"
                  >
                    <Zap className="w-5 h-5" />
                    Convert Audio to {outputFormat.toUpperCase()}
                  </button>
                )}

                {/* Result Card */}
                {result && status === 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-green-500/10 border border-green-500/20 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                          <Check className="w-4 h-4" />
                          Ready for Download!
                        </div>
                        <p className="text-base font-bold text-navy-900 dark:text-white mt-1">
                          {result.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          File size: {formatFileSize(result.fileSize)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <a
                          href={result.downloadUrl}
                          download
                          className="flex-1 sm:flex-none btn-primary py-2.5 px-6 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                        <button
                          onClick={handleReset}
                          className="btn-ghost text-sm py-2.5 px-4"
                        >
                          Convert Another
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Conversion History */}
        {history.filter((item) => item.type === 'audio').length > 0 && (
          <AnimatedSection delay={0.2} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Recent Conversions</h3>
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {history
                .filter((item) => item.type === 'audio')
                .map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                        <FileAudio className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900 dark:text-white truncate">
                          {item.inputFileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.outputFormat.toUpperCase()} • {formatFileSize(item.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download
                          className="p-2 rounded-lg hover:bg-pink-primary/10 text-pink-primary"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </PageTransition>
  );
}
