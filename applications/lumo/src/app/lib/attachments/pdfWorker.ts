// pdf.js worker entry. Starting it from our own code (see pdfParse.ts) lets webpack bundle it, so it
// runs with webpack's runtime and our polyfills instead of as a standalone copy of the pdf.js file.
// pdf.worker.mjs connects itself to this worker's message port when it loads.
import 'core-js/stable';
import 'pdfjs-dist/legacy/build/pdf.worker.mjs';
