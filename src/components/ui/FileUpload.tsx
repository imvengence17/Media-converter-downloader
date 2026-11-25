'use client';

import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileIcon, Image, Video, FileAudio, FileText } from 'lucide-react';
import { cn, formatFileSize, getFileExtension, isVideoFormat, isAudioFormat, isImageFormat, isPdfFormat, truncateFilename } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  description?: string;
  className?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

export default function FileUpload({
  accept,
  multiple = false,
  maxSize,
  onFilesSelected,
  label = 'Upload Files',
  description = 'Drag and drop files here, or click to browse',
  className,
  showPreview = true,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    const validFiles = newFiles.filter(f => {
      if (maxSize && f.size > maxSize) return false;
      return true;
    });

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
      onFilesSelected([...files, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
      onFilesSelected(validFiles.slice(0, 1));
    }

    // Generate previews for images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => ({
            ...prev,
            [file.name + file.size]: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  }, [files, maxSize, multiple, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (file: File) => {
    const ext = getFileExtension(file.name);
    if (isImageFormat(ext)) return <Image className="w-5 h-5 text-green-500" />;
    if (isVideoFormat(ext)) return <Video className="w-5 h-5 text-blue-500" />;
    if (isAudioFormat(ext)) return <FileAudio className="w-5 h-5 text-purple-500" />;
    if (isPdfFormat(ext)) return <FileText className="w-5 h-5 text-red-500" />;
    return <FileIcon className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'upload-zone',
          isDragging && 'drag-over',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <motion.div
          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-primary/10 to-pink-primary/5 dark:from-pink-primary/20 dark:to-pink-primary/10 flex items-center justify-center"
        >
          <Upload className={cn(
            'w-7 h-7 transition-colors duration-200',
            isDragging ? 'text-pink-primary' : 'text-gray-400 dark:text-gray-500'
          )} />
        </motion.div>

        <div className="text-center">
          <p className="text-base font-semibold text-navy-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          {maxSize && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Max file size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn-primary text-sm"
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Browse Files
        </button>
      </div>

      {/* File List */}
      <AnimatePresence>
        {showPreview && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => {
              const previewKey = file.name + file.size;
              return (
                <motion.div
                  key={previewKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-gray-700"
                >
                  {previews[previewKey] ? (
                    <img
                      src={previews[previewKey]}
                      alt={file.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-navy-800 flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-navy-900 dark:text-white">
                      {truncateFilename(file.name, 40)}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
