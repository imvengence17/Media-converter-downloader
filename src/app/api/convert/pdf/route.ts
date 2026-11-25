import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import { saveTempFile, createTempFile, deleteTempFile } from '@/lib/file-storage';
import { getFileExtension } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Please upload at least one file' }, { status: 400 });
    }

    switch (action) {
      case 'image-to-pdf': {
        const pdfDoc = await PDFDocument.create();

        for (const file of files) {
          const bytes = await file.arrayBuffer();
          let imgBuffer = Buffer.from(bytes);
          const ext = getFileExtension(file.name).toLowerCase();

          let embeddedImage;
          if (ext === 'jpg' || ext === 'jpeg') {
            embeddedImage = await pdfDoc.embedJpg(new Uint8Array(imgBuffer));
          } else if (ext === 'png') {
            embeddedImage = await pdfDoc.embedPng(new Uint8Array(imgBuffer));
          } else {
            // Convert WebP, GIF, TIFF, BMP to PNG via sharp
            const pngBuffer = await sharp(imgBuffer).png().toBuffer();
            embeddedImage = await pdfDoc.embedPng(new Uint8Array(pngBuffer));
          }

          const { width, height } = embeddedImage;
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }

        const pdfBytes = await pdfDoc.save();
        const { id, path: outputPath } = createTempFile('pdf');
        fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

        const fileName = 'images_converted.pdf';
        return NextResponse.json({
          id,
          fileName,
          fileSize: pdfBytes.length,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          pageCount: pdfDoc.getPageCount(),
        });
      }

      case 'merge': {
        if (files.length < 2) {
          return NextResponse.json({ error: 'Please upload at least two PDF files to merge' }, { status: 400 });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const doc = await PDFDocument.load(bytes);
          const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedBytes = await mergedPdf.save();
        const { id, path: outputPath } = createTempFile('pdf');
        fs.writeFileSync(outputPath, Buffer.from(mergedBytes));

        const fileName = 'merged_document.pdf';
        return NextResponse.json({
          id,
          fileName,
          fileSize: mergedBytes.length,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          pageCount: mergedPdf.getPageCount(),
        });
      }

      case 'split': {
        const file = files[0];
        const pageRangeStr = (formData.get('pageRange') as string) || '1';
        const bytes = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(bytes);
        const totalPages = srcDoc.getPageCount();

        // Parse ranges like "1-3, 5" into 0-based page indices
        const indicesToKeep = new Set<number>();
        const parts = pageRangeStr.split(',').map((p) => p.trim());

        for (const part of parts) {
          if (part.includes('-')) {
            const [startStr, endStr] = part.split('-');
            const start = Math.max(1, parseInt(startStr, 10));
            const end = Math.min(totalPages, parseInt(endStr, 10));
            for (let i = start; i <= end; i++) {
              indicesToKeep.add(i - 1);
            }
          } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
              indicesToKeep.add(pageNum - 1);
            }
          }
        }

        const selectedIndices = Array.from(indicesToKeep).sort((a, b) => a - b);
        if (selectedIndices.length === 0) {
          return NextResponse.json({ error: `Invalid page range. Document has ${totalPages} pages.` }, { status: 400 });
        }

        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
        copiedPages.forEach((page) => newDoc.addPage(page));

        const splitBytes = await newDoc.save();
        const { id, path: outputPath } = createTempFile('pdf');
        fs.writeFileSync(outputPath, Buffer.from(splitBytes));

        const fileName = `split_${file.name}`;
        return NextResponse.json({
          id,
          fileName,
          fileSize: splitBytes.length,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          pageCount: newDoc.getPageCount(),
        });
      }

      case 'rotate': {
        const file = files[0];
        const angleDeg = parseInt((formData.get('angle') as string) || '90', 10);
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);

        const pages = doc.getPages();
        pages.forEach((page) => {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + angleDeg) % 360));
        });

        const rotatedBytes = await doc.save();
        const { id, path: outputPath } = createTempFile('pdf');
        fs.writeFileSync(outputPath, Buffer.from(rotatedBytes));

        const fileName = `rotated_${file.name}`;
        return NextResponse.json({
          id,
          fileName,
          fileSize: rotatedBytes.length,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          pageCount: pages.length,
        });
      }

      case 'add-numbers': {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const pages = doc.getPages();
        const total = pages.length;

        pages.forEach((page, idx) => {
          const { width } = page.getSize();
          const text = `Page ${idx + 1} of ${total}`;
          const textWidth = font.widthOfTextAtSize(text, 10);
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: 20,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        });

        const numberedBytes = await doc.save();
        const { id, path: outputPath } = createTempFile('pdf');
        fs.writeFileSync(outputPath, Buffer.from(numberedBytes));

        const fileName = `numbered_${file.name}`;
        return NextResponse.json({
          id,
          fileName,
          fileSize: numberedBytes.length,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          pageCount: total,
        });
      }

      case 'pdf-to-text': {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Dynamically load pdf-parse
        let extractedText = '';
        let totalPages = 1;
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const parsed = await pdfParse(buffer);
          extractedText = parsed.text || '';
          totalPages = parsed.numpages || 1;
        } catch (e: any) {
          extractedText = 'Unable to extract textual layer. The PDF might contain scanned images only (use our OCR tool instead).';
        }

        // Save as downloadable TXT
        const { id, path: outputPath } = createTempFile('txt');
        fs.writeFileSync(outputPath, extractedText, 'utf8');

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const fileName = `${baseName}_extracted.txt`;

        return NextResponse.json({
          id,
          fileName,
          fileSize: Buffer.byteLength(extractedText),
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          text: extractedText,
          pageCount: totalPages,
        });
      }

      case 'compress': {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);

        // PDF-lib optimizes structure upon re-saving
        const compressedBytes = await doc.save({ useObjectStreams: true });
        const { id, path: outputPath } = createTempFile('pdf');
        fs.writeFileSync(outputPath, Buffer.from(compressedBytes));

        const fileName = `compressed_${file.name}`;
        return NextResponse.json({
          id,
          fileName,
          fileSize: compressedBytes.length,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
          pageCount: doc.getPageCount(),
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported PDF action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('PDF route error:', error);
    return NextResponse.json(
      { error: error.message || 'PDF processing failed' },
      { status: 500 }
    );
  }
}
