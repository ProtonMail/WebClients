/*
 * Copyright notice:
 *
 * This file was adapted from https://gitlab.com/autokent/pdf-parse, MIT license
 */
import * as PDFJS from 'pdfjs-dist';
// import workerSrc from 'pdfjs-dist/build/pdf.worker?worker&url'
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';

const workerSrc = new URL('../../../../../../node_modules/pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
PDFJS.GlobalWorkerOptions.workerSrc = workerSrc;

// Define the interface for render options
interface RenderOptions {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
}

// Define the interface for PDF options
interface PDFOptions {
    pagerender: (pageData: any) => Promise<string>;
    max: number;
}

// Define the interface for the PDF return object
interface PDFReturn {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
}

// Define the default options
const DEFAULT_OPTIONS: PDFOptions = {
    pagerender: renderPage,
    max: 0,
};

// Function to render a page
async function renderPage(pageData: any): Promise<string> {
    // Define render options
    const renderOptions: RenderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false,
    };

    const textContent: TextContent = await pageData.getTextContent(renderOptions);
    let lastY: number | undefined;
    let lastHeight: number | undefined;
    let text = '';
    // const styles = textContent.styles;
    const items = textContent.items;
    for (const item_ of items) {
        if ((item_ as TextItem).str !== undefined) {
            const item = item_ as TextItem;
            const y = item.transform[5];
            // const fontName = item.fontName;
            // const style = styles[fontName];
            // console.log({ item, style });
            const deltaY = lastY !== undefined ? (lastY as number) - y : 0;
            const lineBreak = lastHeight ? deltaY / lastHeight : 0;
            let lineBreakCount = Math.round(lineBreak);
            if (lineBreakCount < 0) {
                lineBreakCount = 2;
            }
            // console.log(`ΔY = ${deltaY}, line breaks: ${lineBreak} (rounded to ${lineBreakCount})`);
            const newlines = '\n'.repeat(Math.min(lineBreakCount, 2));
            text += newlines + item.str;
            if (item.height) lastHeight = item.height;
            lastY = y;
        } else {
            // const item = item_ as TextMarkedContent;
        }
    }
    return text;
}

// Main PDF function
async function pdfParse(dataBuffer: any, options?: Partial<PDFOptions>): Promise<PDFReturn> {
    const ret: PDFReturn = {
        numpages: 0,
        numrender: 0,
        info: null,
        metadata: null,
        text: '',
    };

    const options_: PDFOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
    };

    try {
        const doc = await PDFJS.getDocument(dataBuffer).promise;
    ret.numpages = doc.numPages;

    const metaData = await doc.getMetadata().catch(console.warn);

    ret.info = metaData ? metaData.info : null;
    ret.metadata = metaData ? metaData.metadata : null;

    let counter = options_.max <= 0 ? doc.numPages : options_.max;
    counter = counter > doc.numPages ? doc.numPages : counter;

    ret.text = '';

    for (let i = 1; i <= counter; i++) {
        const pageText = await doc
            .getPage(i)
            .then((pageData: any) => options_.pagerender(pageData))
            .catch(console.error);
        ret.text = `${ret.text}\n\n${pageText}`;
    }

        ret.numrender = counter;
        void doc.destroy();

        return ret;
    } catch (error) {
        throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export default pdfParse;
