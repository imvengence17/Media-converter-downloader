'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Send,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Bug,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition, AnimatedSection } from '@/components/ui/AnimatedSection';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'Is MediaConvert completely free to use?',
    a: 'Yes, MediaConvert is 100% free with no hidden subscriptions, watermarks, or account registration requirements.',
  },
  {
    q: 'How long are converted files retained on the server?',
    a: 'All files are automatically deleted after 60 minutes. You can also download them immediately after conversion completes.',
  },
  {
    q: 'What is the maximum file size limit?',
    a: 'We support uploads up to 500MB for video and audio files, 100MB for PDFs, and 50MB for individual image files.',
  },
  {
    q: 'Can I extract text from scanned handwritten notes?',
    a: 'Our neural OCR engine works exceptionally well on printed documents, receipts, screenshots, and clean handwritten notes across 8+ languages.',
  },
  {
    q: 'How does batch conversion work?',
    a: 'On the Image Converter page, you can select multiple images at once. MediaConvert processes them in parallel and lets you download all results as a single ZIP archive.',
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitted(true);
    toast.success('Your message has been received! Our support team will respond shortly.');
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setSubmitted(false);
  };

  return (
    <PageTransition className="min-h-screen pt-24 pb-16 bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <AnimatedSection className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-pink-primary/10 text-pink-primary mb-2">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="section-heading">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="section-subheading mx-auto">
            Have questions, feedback, or a conversion issue to report? We&apos;d love to hear from you.
          </p>
        </AnimatedSection>

        {/* Form & Support Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <AnimatedSection delay={0.1} className="lg:col-span-2">
            <div className="glass-card p-6 md:p-8">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy-900 dark:text-white">Message Sent!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    Thank you for reaching out. We usually review and respond to inquiries within 24 hours.
                  </p>
                  <button onClick={handleReset} className="btn-primary text-sm mt-4">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-900 dark:text-gray-300">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-900 dark:text-gray-300">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-900 dark:text-gray-300">
                      Inquiry Type
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field text-sm cursor-pointer"
                    >
                      <option value="general">General Question</option>
                      <option value="bug">Conversion Error Report</option>
                      <option value="feature">Format / Feature Request</option>
                      <option value="api">Enterprise & API Inquiries</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-900 dark:text-gray-300">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your question or issue in detail..."
                      className="input-field text-sm resize-none"
                    />
                  </div>

                  <button type="submit" className="w-full btn-primary py-3 text-sm">
                    <Send className="w-4 h-4" />
                    Submit Message
                  </button>
                </form>
              )}
            </div>
          </AnimatedSection>

          {/* Quick Support Channels */}
          <AnimatedSection delay={0.2} className="space-y-4">
            <div className="glass-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-primary/10 text-pink-primary flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white">Live Support</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Need immediate help with a conversion workflow? Check out our FAQ or open a ticket.
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Bug className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white">Bug Reports</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Encountered an unrecognized video codec or corrupt conversion? Let us know with sample details.
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* FAQ Section */}
        <AnimatedSection delay={0.3} className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-pink-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-500">
              Common questions about security, limitations, and conversions.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-card overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-semibold text-sm text-navy-900 dark:text-white flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0',
                        isOpen && 'transform rotate-180 text-pink-primary'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </PageTransition>
  );
}
