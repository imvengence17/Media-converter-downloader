'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Images,
  Combine,
  Split,
  RotateCw,
  Hash,
  Minimize2,
  Download,
  Copy,
  Check,
  Zap,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition, AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import FileUpload from '@/components/ui/FileUpload';
import ConversionProgress from '@/components/ui/ConversionProgress';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import type { ConversionStatus } from '@/types';
import { cn, formatFileSize, truncateFilename } from '@/lib/utils';

type PdfToolType = 'image-to-pdf' | 'merge' | 'split' | 'pdf-to-text' | 'rotate' | 'add-numbers' | 'compress';

const PDF_TOOLS = [
  {
    id: 'image-to-pdf' as PdfToolType,
    name: 'Image to PDF',
    description: 'Convert JPG, PNG, WebP images to a multi-page PDF',
    icon: Images,
    badge: 'Popular',
    color: 'from-pink-500 to-rose-400',
  },
  {
    id: 'merge' as PdfToolType,
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single document',
    icon: Combine,
    badge: 'Essential',
    color: 'from-blue-500 to-indigo-400',
  },
  {
    id: 'split' as PdfToolType,
    name: 'Split PDF',
    description: 'Extract specific pages or page ranges from a PDF',
    icon: Split,
    badge: 'Quick',
    color: 'from-amber-500 to-orange-400',
  },
  {
    id: 'pdf-to-text' as PdfToolType,
    name: 'PDF to Text',
    description: 'Extract raw selectable text from your PDF file',
    icon: FileText,
    badge: 'Smart',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    id: 'rotate' as PdfToolType,
    name: 'Rotate PDF',
    description: 'Rotate all pages by 90°, 180°, or 270°',
    icon: RotateCw,
    badge: 'Easy',
    color: 'from-purple-500 to-violet-400',
  },
  {
    id: 'add-numbers' as PdfToolType,
    name: 'Add Page Numbers',
    description: 'Insert footer page numbering on every page',
    icon: Hash,
    badge: 'Formal',
    color: 'from-cyan-500 to-blue-400',
  },
  {
    id: 'compress' as PdfToolType,
    name: 'Compress PDF',
    description: 'Optimize file size while maintaining readability',
    icon: Minimize2,
    badge: 'Save Space',
    color: 'from-rose-500 to-pink-400',
  },
];

interface ToolResult {
  id: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  pageCount?: number;
  text?: string;
}

export default function PdfToolsPage() {
  const [activeTool, setActiveTool] = useState<PdfToolType>('image-to-pdf');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pageRange, setPageRange] = useState('1-2');
  const [rotateAngle, setRotateAngle] = useState('90');
  const [copied, setCopied] = useState(false);

  // Status state
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ToolResult | null>(null);

  const { history, addItem, removeItem, clearHistory } = useConversionHistory();

  const handleToolSelect = (toolId: PdfToolType) => {
    setActiveTool(toolId);
    setSelectedFiles([]);
    setResult(null);
    setStatus('idle');
    setProgress(0);
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setResult(null);
    setStatus('idle');
  };

  const handleExecute = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please upload file(s) first');
      return;
    }

    if (activeTool === 'merge' && selectedFiles.length < 2) {
      toast.error('Please upload at least 2 PDF files to merge');
      return;
    }

    setStatus('uploading');
    setProgress(20);
    setProgressMessage('Uploading files...');

    try {
      const formData = new FormData();
      formData.append('action', activeTool);
      selectedFiles.forEach((file) => formData.append('files', file));

      if (activeTool === 'split') {
        formData.append('pageRange', pageRange);
      } else if (activeTool === 'rotate') {
        formData.append('angle', rotateAngle);
      }

      setProgress(50);
      setStatus('processing');
      setProgressMessage('Processing PDF...');

      const response = await fetch('/api/convert/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const data: ToolResult = await response.json();
      setProgress(100);
      setResult(data);
      setStatus('completed');
      setProgressMessage('Done!');
      toast.success('PDF processed successfully!');

      addItem({
        id: data.id,
        type: 'pdf',
        inputFileName: selectedFiles[0].name,
        outputFileName: data.fileName,
        outputFormat: 'pdf',
        fileSize: data.fileSize,
        convertedAt: new Date().toISOString(),
        downloadUrl: data.downloadUrl,
      });
    } catch (err: any) {
      setStatus('error');
      setProgressMessage(err.message || 'Operation failed');
      toast.error(err.message || 'Operation failed');
    }
  };

  const copyText = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const currentToolMeta = PDF_TOOLS.find((t) => t.id === activeTool)!;

  return (
    <PageTransition className="min-h-screen pt-24 pb-16 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <AnimatedSection className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 mb-2">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="section-heading">
            PDF <span className="gradient-text">Studio</span>
          </h1>
          <p className="section-subheading mx-auto">
            Merge, split, convert, rotate, and manage your PDF documents securely in your browser.
          </p>
        </AnimatedSection>

        {/* Tools Tabs / Cards */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {PDF_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={cn(
                    'text-left p-4 rounded-2xl transition-all duration-200 border text-sm flex flex-col justify-between group',
                    isSelected
                      ? 'bg-pink-primary/10 border-pink-primary shadow-glow text-navy-900 dark:text-white'
                      : 'bg-white/60 dark:bg-navy-900/40 border-gray-200 dark:border-gray-800 hover:border-pink-primary/40 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
                        tool.color
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-500">
                      {tool.badge}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 dark:text-white text-sm">{tool.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </AnimatedSection>

        {/* Active Tool Workspace */}
        <AnimatedSection delay={0.2}>
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
                    currentToolMeta.color
                  )}
                >
                  <currentToolMeta.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                    {currentToolMeta.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentToolMeta.description}
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Zone */}
            <FileUpload
              accept={
                activeTool === 'image-to-pdf'
                  ? 'image/*,.jpg,.jpeg,.png,.webp'
                  : '.pdf,application/pdf'
              }
              multiple={activeTool === 'image-to-pdf' || activeTool === 'merge'}
              onFilesSelected={handleFilesSelected}
              label={
                activeTool === 'image-to-pdf'
                  ? 'Upload images to compile into PDF'
                  : activeTool === 'merge'
                  ? 'Upload multiple PDF files to combine'
                  : 'Select a PDF document'
              }
              description={
                activeTool === 'image-to-pdf'
                  ? 'Supports JPG, PNG, WEBP, and more'
                  : 'Fast and private server-side processing'
              }
            />

            {/* Custom Settings per Tool */}
            {activeTool === 'split' && selectedFiles.length > 0 && (
              <div className="p-4 rounded-xl bg-white/60 dark:bg-navy-900/40 border border-gray-200 dark:border-gray-800 space-y-2">
                <label className="block text-sm font-semibold text-navy-900 dark:text-white">
                  Page Range to Extract
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 8"
                  className="input-field text-sm font-mono"
                />
                <p className="text-xs text-gray-500">
                  Example: <code className="bg-gray-100 dark:bg-navy-800 px-1 py-0.5 rounded">1-4, 7</code> extracts pages 1 through 4 plus page 7.
                </p>
              </div>
            )}

            {activeTool === 'rotate' && selectedFiles.length > 0 && (
              <div className="p-4 rounded-xl bg-white/60 dark:bg-navy-900/40 border border-gray-200 dark:border-gray-800 space-y-2">
                <label className="block text-sm font-semibold text-navy-900 dark:text-white">
                  Rotation Angle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['90', '180', '270'].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotateAngle(deg)}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        rotateAngle === deg
                          ? 'bg-pink-primary text-white border-pink-primary'
                          : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {deg}° Clockwise
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress */}
            {status !== 'idle' && (
              <ConversionProgress
                progress={progress}
                status={status}
                message={progressMessage}
                onRetry={handleExecute}
              />
            )}

            {/* Execute Button */}
            {status !== 'completed' && selectedFiles.length > 0 && (
              <button
                onClick={handleExecute}
                disabled={status === 'uploading' || status === 'processing'}
                className="w-full btn-primary py-3.5 text-base"
              >
                <Zap className="w-5 h-5" />
                Process with {currentToolMeta.name}
              </button>
            )}

            {/* Results Display */}
            {result && status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                      <FileCheck className="w-5 h-5" />
                      Document Ready!
                    </div>
                    <p className="text-base font-bold text-navy-900 dark:text-white mt-1">
                      {result.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(result.fileSize)}
                      {result.pageCount ? ` • ${result.pageCount} page(s)` : ''}
                    </p>
                  </div>

                  <a
                    href={result.downloadUrl}
                    download
                    className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 self-stretch sm:self-auto justify-center"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                </div>

                {/* If PDF to Text result, show preview editor */}
                {result.text !== undefined && (
                  <div className="mt-4 pt-4 border-t border-green-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-navy-900 dark:text-white">
                        Extracted Text Preview
                      </span>
                      <button
                        onClick={copyText}
                        className="btn-ghost text-xs flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy Text'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={result.text}
                      rows={8}
                      className="w-full p-4 rounded-xl bg-white dark:bg-navy-900 font-mono text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </AnimatedSection>

        {/* History */}
        {history.filter((item) => item.type === 'pdf').length > 0 && (
          <AnimatedSection delay={0.3} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Recent PDF Tasks</h3>
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
                .filter((item) => item.type === 'pdf')
                .map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900 dark:text-white truncate">
                          {item.inputFileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(item.fileSize)}
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
