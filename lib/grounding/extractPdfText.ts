/**
 * @file extractPdfText.ts
 * @description PDF → plain text using pdf-parse v2 (Node runtime).
 * Dynamic import keeps pdfjs + canvas loading on the server only (see `serverExternalPackages` in next.config).
 */

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    await parser.destroy();
  }
}

