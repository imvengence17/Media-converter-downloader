'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanText,
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  FileType,
  Sparkles,
  RotateCcw,
  Languages,
  Eye,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition, AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import FileUpload from '@/components/ui/FileUpload';
import ConversionProgress from '@/components/ui/ConversionProgress';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import type { ConversionStatus } from '@/types';
import { cn, formatFileSize, truncateFilename } from '@/lib/utils';

const OCR_LANGUAGES = [
  { label: 'English', code: 'eng' },
  { label: 'Spanish (Español)', code: 'spa' },
  { label: 'French (Français)', code: 'fra' },
  { label: 'German (Deutsch)', code: 'deu' },
  { label: 'Italian (Italiano)', code: 'ita' },
  { label: 'Portuguese (Português)', code: 'por' },
  { label: 'Chinese (Simplified)', code: 'chi_sim' },
  { label: 'Japanese', code: 'jpn' },
];

export default function OcrPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState('eng');
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Status
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const { history, addItem, removeItem, clearHistory } = useConversionHistory();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setExtractedText('');
      setConfidence(null);
      setStatus('idle');

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
      setExtractedText('');
    }
  };

  const handleRunOcr = async () => {
    if (!selectedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setStatus('uploading');
    setProgress(20);
    setProgressMessage('Analyzing image structure...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', language);

      setProgress(40);
      setStatus('processing');
      setProgressMessage('Running Tesseract neural optical recognition...');

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR processing failed');
      }

      const data = await response.json();
      setProgress(100);
      setStatus('completed');
      setExtractedText(data.text);
      setConfidence(data.confidence);
      setProgressMessage('Text recognized successfully!');
      toast.success('Text extracted successfully!');

      addItem({
        id: data.id,
        type: 'ocr',
        inputFileName: selectedFile.name,
        outputFileName: data.fileName,
        outputFormat: 'txt',
        fileSize: data.text.length,
        convertedAt: new Date().toISOString(),
        downloadUrl: data.downloadUrl,
      });
    } catch (err: any) {
      setStatus('error');
      setProgressMessage(err.message || 'OCR failed');
      toast.error(err.message || 'OCR recognition failed');
    }
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success('Copied text to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    if (!extractedText) return;
    setExportingFormat(format);
    try {
      const formData = new FormData();
      formData.append('exportFormat', format);
      formData.append('text', extractedText);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();

      // Trigger browser download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error('Failed to export document');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setExtractedText('');
    setConfidence(null);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <PageTransition className="min-h-screen pt-24 pb-16 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <AnimatedSection className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 mb-2">
            <ScanText className="w-8 h-8" />
          </div>
          <h1 className="section-heading">
            Image to <span className="gradient-text">Text (OCR)</span>
          </h1>
          <p className="section-subheading mx-auto">
            Extract text from scanned documents, screenshots, and photos with multi-language AI vision.
          </p>
        </AnimatedSection>

        {/* Main Work Area */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card p-6 md:p-8 space-y-6">
            {!selectedFile ? (
              <FileUpload
                accept="image/*,.jpg,.jpeg,.png,.webp,.bmp"
                maxSize={50 * 1024 * 1024}
                onFilesSelected={handleFilesSelected}
                label="Upload image or screenshot to extract text"
                description="Supports PNG, JPG, JPEG, WEBP, Scanned documents up to 50MB"
              />
            ) : (
              <div className="space-y-6">
                {/* Configuration Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/70 dark:bg-navy-900/60 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-pink-primary" />
                    <span className="text-sm font-semibold text-navy-900 dark:text-white">
                      Document Language:
                    </span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-navy-900 text-sm font-medium focus:ring-2 focus:ring-pink-primary"
                    >
                      {OCR_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1.5 self-end sm:self-center transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Change Image
                  </button>
                </div>

                {/* Split View: Image Preview vs Text Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Image Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                      <span>Source Image</span>
                      <span>{selectedFile.name}</span>
                    </div>
                    <div className="h-96 rounded-2xl bg-gray-100 dark:bg-navy-950/80 border border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden p-2">
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Source Preview"
                          className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Extracted Text Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase">
                      <span className="text-gray-500">Extracted Text (Editable)</span>
                      {confidence !== null && (
                        <span className="text-pink-primary font-mono lowercase">
                          {confidence}% confidence
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <textarea
                        value={extractedText}
                        onChange={(e) => setExtractedText(e.target.value)}
                        placeholder="Extracted text will appear here. You can freely edit or copy it."
                        rows={14}
                        className="w-full h-96 p-4 rounded-2xl bg-white dark:bg-navy-900/90 font-mono text-xs leading-relaxed text-navy-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {status !== 'idle' && status !== 'completed' && (
                  <ConversionProgress
                    progress={progress}
                    status={status}
                    message={progressMessage}
                    onRetry={handleRunOcr}
                  />
                )}

                {/* Actions Bar */}
                {status !== 'completed' ? (
                  <button
                    onClick={handleRunOcr}
                    disabled={status === 'uploading' || status === 'processing'}
                    className="w-full btn-primary py-3.5 text-base"
                  >
                    <Zap className="w-5 h-5" />
                    Extract Text with AI OCR
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={handleCopyText}
                      className="btn-outline text-sm py-2.5 px-5 flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Text'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport('txt')}
                        disabled={exportingFormat !== null}
                        className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download .TXT
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        disabled={exportingFormat !== null}
                        className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                      >
                        <FileType className="w-3.5 h-3.5" />
                        Download .DOCX
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        disabled={exportingFormat !== null}
                        className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download .PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* History */}
        {history.filter((item) => item.type === 'ocr').length > 0 && (
          <AnimatedSection delay={0.2} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Recent OCR Transcriptions</h3>
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
                .filter((item) => item.type === 'ocr')
                .map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <ScanText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900 dark:text-white truncate">
                          {item.inputFileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Extracted text • {new Date(item.convertedAt).toLocaleDateString()}
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
