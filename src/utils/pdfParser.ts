/**
 * Client-Side Resume Document Extractor
 * Extracts digital text directly in the candidate's browser using pdfjs-dist.
 * If a scanned PDF is detected, renders Page 1 to canvas for image fallback.
 */

export interface ClientParsedDocument {
  isScanned: boolean;
  fileName: string;
  textContent: string;
  imageBlob?: Blob;
  pageCount: number;
}

export async function processPdfInBrowser(file: File): Promise<ClientParsedDocument> {
  try {
    // Dynamically import pdfjs-dist in the browser
    const pdfjsLib = await import('pdfjs-dist');

    // Configure worker source to unpkg matching the version installed
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
    
    // Fetch and create a blob URL to avoid CORS cross-origin restrictions in Vite
    try {
      const workerRes = await fetch(workerUrl);
      if (workerRes.ok) {
        const workerBlob = await workerRes.blob();
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
      } else {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      }
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    let totalText = '';
    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      totalText += pageText + '\n';
    }

    const cleanText = totalText.replace(/\s+/g, ' ').trim();

    // If substantial text was extracted, return directly
    if (cleanText.length > 200) {
      return {
        isScanned: false,
        fileName: file.name,
        textContent: cleanText,
        pageCount: numPages,
      };
    }

    // Scanned PDF fallback: render Page 1 to HTML5 canvas
    console.log('[pdfParser] Low text detected (<200 chars). Rendering Page 1 to canvas for image fallback...');
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (context) {
      await page.render({
        canvasContext: context,
        viewport,
        canvas: canvas,
      } as any).promise;

      const imageBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });

      if (imageBlob) {
        return {
          isScanned: true,
          fileName: file.name.replace(/\.pdf$/i, '.png'),
          textContent: cleanText,
          imageBlob,
          pageCount: numPages,
        };
      }
    }

    return {
      isScanned: false,
      fileName: file.name,
      textContent: cleanText,
      pageCount: numPages,
    };
  } catch (err: any) {
    console.warn('[pdfParser] Client-side PDF extraction error:', err);
    // Fallback: Return empty text to let heuristic or server handle it
    return {
      isScanned: false,
      fileName: file.name,
      textContent: '',
      pageCount: 1,
    };
  }
}

/**
 * Universal browser document text extractor
 * Handles PDFs, TXT, and Markdown files right in the client
 */
export async function extractDocumentTextInBrowser(
  input: File | Blob | string,
  fileName?: string
): Promise<ClientParsedDocument> {
  if (typeof input === 'string') {
    return {
      isScanned: false,
      fileName: fileName || 'resume.txt',
      textContent: input.trim(),
      pageCount: 1,
    };
  }

  const name = fileName || (input as any).name || 'resume.pdf';
  const lowerName = name.toLowerCase();

  // If PDF, process with pdfjs-dist
  if (lowerName.endsWith('.pdf') || input.type === 'application/pdf') {
    return processPdfInBrowser(input as File);
  }

  // If TXT, Markdown, CSV, or plain text
  try {
    const text = await input.text();
    return {
      isScanned: false,
      fileName: name,
      textContent: text.trim(),
      pageCount: 1,
    };
  } catch (e) {
    console.warn('[pdfParser] Plain text reading error:', e);
    return {
      isScanned: false,
      fileName: name,
      textContent: '',
      pageCount: 1,
    };
  }
}
