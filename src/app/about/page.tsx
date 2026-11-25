'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Trash2,
  FileCheck2,
  Zap,
  Globe,
  Heart,
  Server,
  Layers,
} from 'lucide-react';
import { PageTransition, AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

export default function AboutPage() {
  return (
    <PageTransition className="min-h-screen pt-24 pb-16 bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-pink-primary/10 text-pink-primary mb-2">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="section-heading">
            About <span className="gradient-text">MediaConvert</span>
          </h1>
          <p className="section-subheading mx-auto">
            The next-generation media transformation engine built for privacy, speed, and effortless productivity.
          </p>
        </AnimatedSection>

        {/* Core Pillars */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-pink-primary/10 text-pink-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Strict Privacy by Design</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Your media belongs to you. All files are automatically scrubbed and deleted from our temporary storage within 60 minutes of processing.
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Native Media Engines</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Powered by industry-standard tools including FFmpeg, Sharp, PDF-Lib, and Tesseract neural networks for flawless conversions.
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Zero Account Overhead</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                No compulsory registrations, no credit cards, and no annoying paywalls. Professional tools accessible to everyone worldwide.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Architecture & Performance */}
        <AnimatedSection delay={0.2} className="glass-card p-8 md:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-pink-primary" />
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
              Under the Hood Architecture
            </h2>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            MediaConvert utilizes a decoupled streaming architecture. Video and audio transcoding occurs on isolated hardware instances utilizing hardware-accelerated codecs. Image compression uses MozJPEG, Libvips, and modern AVIF algorithms that outperform legacy browser canvas converters.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
            <div>
              <p className="text-2xl font-extrabold text-pink-primary">100+</p>
              <p className="text-xs text-gray-500">Formats Supported</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-pink-primary">0 min</p>
              <p className="text-xs text-gray-500">File Retention Post-TTL</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-pink-primary">100%</p>
              <p className="text-xs text-gray-500">Client Encryption</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-pink-primary">4K</p>
              <p className="text-xs text-gray-500">Max Video Resolution</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Privacy Policy & Terms Anchor Sections */}
        <AnimatedSection delay={0.3} className="space-y-8">
          <div id="privacy" className="glass-card p-8 space-y-4">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-pink-primary" />
              Privacy Policy
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
              <p>
                We do not sell, rent, monetize, or harvest your media uploads. When a file is uploaded, it is assigned a cryptographic randomized UUID, converted within a sandbox, and made available for direct download.
              </p>
              <p>
                Temporary files are automatically purged from our server disk within 1 hour. We never inspect the contents of your files, documents, or OCR extractions.
              </p>
            </div>
          </div>

          <div id="terms" className="glass-card p-8 space-y-4">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-pink-primary" />
              Terms of Service
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
              <p>
                By using MediaConvert, you agree not to submit malicious binaries, viruses, or unlawful content. MediaConvert is provided &ldquo;as is&rdquo; without warranties of any kind.
              </p>
              <p>
                Users are solely responsible for ensuring they possess the appropriate legal rights, licenses, and authorizations for all multimedia processed through our conversion pipelines.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </PageTransition>
  );
}
