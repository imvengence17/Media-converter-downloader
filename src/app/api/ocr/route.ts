import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createTempFile, saveTempFile, deleteTempFile } from '@/lib/file-storage';
import { getFileExtension } from '@/lib/utils';

export async function POST(request: NextRequest) {
  let worker: any = null;
  let tempImagePath = '';
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const lang = (formData.get('language') as string) || 'eng';
    const exportFormat = formData.get('exportFormat') as string | null;
    const customText = formData.get('text') as string | null;

    // Handle export request for previously extracted/edited text
    if (exportFormat && customText) {
      if (exportFormat === 'txt') {
        const { id, path: outPath } = createTempFile('txt');
        fs.writeFileSync(outPath, customText, 'utf8');
        const fileName = 'extracted_text.txt';
        return NextResponse.json({
          id,
          fileName,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
        });
      } else if (exportFormat === 'docx') {
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: customText.split('\n').map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun({ text: line || ' ', size: 22 })],
                  })
              ),
            },
          ],
        });
        const docxBuffer = await Packer.toBuffer(doc);
        const { id, path: outPath } = createTempFile('docx');
        fs.writeFileSync(outPath, docxBuffer);
        const fileName = 'extracted_text.docx';
        return NextResponse.json({
          id,
          fileName,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
        });
      } else if (exportFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const lines = customText.split('\n');
        const margin = 50;
        const fontSize = 11;
        const lineHeight = 16;
        let page = pdfDoc.addPage([595, 842]); // A4
        let y = 842 - margin;

        for (const line of lines) {
          if (y < margin) {
            page = pdfDoc.addPage([595, 842]);
            y = 842 - margin;
          }
          // Wrap or truncate long lines simply
          const safeText = line.substring(0, 90);
          page.drawText(safeText || ' ', {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= lineHeight;
        }

        const pdfBytes = await pdfDoc.save();
        const { id, path: outPath } = createTempFile('pdf');
        fs.writeFileSync(outPath, Buffer.from(pdfBytes));
        const fileName = 'extracted_text.pdf';
        return NextResponse.json({
          id,
          fileName,
          downloadUrl: `/api/download/${id}?name=${encodeURIComponent(fileName)}`,
        });
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'Please upload an image for OCR' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = getFileExtension(file.name) || 'png';
    const saved = saveTempFile(buffer, ext);
    tempImagePath = saved.path;

    // Run Tesseract OCR
    worker = await createWorker(lang);
    const ret = await worker.recognize(tempImagePath);
    const recognizedText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    await worker.terminate();
    worker = null;

    // Save default TXT download
    const { id: txtId, path: txtPath } = createTempFile('txt');
    fs.writeFileSync(txtPath, recognizedText, 'utf8');

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const txtFileName = `${baseName}_ocr.txt`;

    return NextResponse.json({
      id: txtId,
      text: recognizedText,
      confidence: Math.round(confidence),
      downloadUrl: `/api/download/${txtId}?name=${encodeURIComponent(txtFileName)}`,
      fileName: txtFileName,
    });
  } catch (error: any) {
    console.error('OCR API error:', error);
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
    }
    return NextResponse.json(
      { error: error.message || 'Failed to extract text from the image' },
      { status: 500 }
    );
  } finally {
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      deleteTempFile(tempImagePath);
    }
  }
}
