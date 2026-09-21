import type { HtmlSlideCaptureOptions } from '../../../util/export/htmlDocumentCapture';
import { sanitizeArtifactExportBodyHtml } from '../../../util/export/sanitizeArtifactExportBodyHtml';
import type { HtmlDocumentToPdfOptions } from '../../../util/pdf/htmlDocumentToPdfBytes';
import { buildPresentationSlidesHtml, extractPresentationSlideFragments } from './artifactPresentationHtml';
import type { ArtifactType, ParsedArtifact } from './parseArtifacts';
import { renderChartsInSlideContent, slideContentHasChartPlaceholder } from './presentationCharts';

const DOCUMENT_EXPORT_STYLES = `
.pdf-export-body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #fff; box-sizing: border-box; width: 100%; }
.artifact-markdown { width: 100%; box-sizing: border-box; }
.artifact-markdown h1, .artifact-markdown h2, .artifact-markdown h3,
.artifact-markdown h4, .artifact-markdown h5, .artifact-markdown h6 {
  color: #111827; font-weight: 600; margin: 1.25em 0 0.5em; line-height: 1.3;
}
.artifact-markdown h1 { font-size: 1.5rem; }
.artifact-markdown h2 { font-size: 1.25rem; }
.artifact-markdown h3 { font-size: 1.125rem; }
.artifact-markdown p { margin: 0 0 0.75em; }
.artifact-markdown ul, .artifact-markdown ol { padding-left: 1.5rem; margin: 0 0 0.75em; }
.artifact-markdown li { margin-bottom: 0.25em; }
.artifact-markdown code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.875em; background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 4px; }
.artifact-markdown pre { background: #f3f4f6; padding: 1rem; border-radius: 8px; overflow: auto; }
.artifact-markdown pre code { background: transparent; padding: 0; }
.artifact-markdown blockquote { border-left: 3px solid #d1d5db; margin: 0 0 0.75em; padding-left: 1rem; color: #4b5563; }
.artifact-markdown table { width: 100%; border-collapse: collapse; margin: 0 0 1rem; }
.artifact-markdown th, .artifact-markdown td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; }
.artifact-markdown th { font-weight: 600; }
`;

const PRESENTATION_EXPORT_STYLES = `
.pdf-export-body { font-family: system-ui, -apple-system, sans-serif; color: #111827; margin: 0; background: #fff; }
.artifact-slides-export { margin: 0; padding: 0; }
.artifact-slide-page {
  box-sizing: border-box;
  width: 960px;
  min-height: 540px;
  padding: 3rem 4rem;
  background: #fff;
  overflow: visible;
}
.artifact-slide-page h1, .artifact-slide-page h2, .artifact-slide-page h3,
.artifact-slide-page h4, .artifact-slide-page h5, .artifact-slide-page h6 {
  margin-top: 0;
  line-height: 1.2;
  font-weight: 600;
}
.artifact-slide-page h1 { font-size: 2.25rem; }
.artifact-slide-page h2 { font-size: 1.875rem; }
.artifact-slide-page h3 { font-size: 1.5rem; }
.artifact-slide-page p, .artifact-slide-page ul, .artifact-slide-page ol { margin: 0 0 0.75em; }
.artifact-slide-page ul, .artifact-slide-page ol { padding-left: 1.5rem; }
.artifact-slide-page img, .artifact-slide-page svg { max-width: 100%; height: auto; }
.artifact-slide-page pre {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  overflow: auto;
  font-size: 0.875rem;
}
.artifact-slide-page code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875em;
  background: #f3f4f6;
  padding: 0.1em 0.35em;
  border-radius: 4px;
}
.artifact-slide-page .fragment,
.artifact-slide-page .fragment:not(.visible) {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}
.artifact-slide-page .r-hstack,
.artifact-slide-page .r-vstack {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}
.artifact-slide-page .r-vstack { flex-direction: column; }
.artifact-slide-page .r-hstack { flex-direction: row; }
.artifact-slide-page .lumo-chart,
.artifact-slide-page .lumo-chart-error {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}
`;

export const PDF_EXPORTABLE_ARTIFACT_TYPES = ['document', 'presentation'] as const;

export type PdfExportableArtifactType = (typeof PDF_EXPORTABLE_ARTIFACT_TYPES)[number];

export const DOCUMENT_PDF_EXPORT_OPTIONS: HtmlDocumentToPdfOptions = {
    viewportWidth: 794,
    pageMarginPt: 54,
};

export const PRESENTATION_PDF_EXPORT_OPTIONS: Omit<HtmlDocumentToPdfOptions, 'pageSelector'> = {
    viewportWidth: 960,
    orientation: 'landscape',
    scale: 1,
};

export const PRESENTATION_PPTX_EXPORT_OPTIONS: HtmlSlideCaptureOptions = {
    viewportWidth: 960,
    scale: 1,
};

export function artifactSupportsPdfExport(type: ArtifactType): type is PdfExportableArtifactType {
    return (PDF_EXPORTABLE_ARTIFACT_TYPES as readonly string[]).includes(type);
}

export function getArtifactPdfExportOptions(
    type: PdfExportableArtifactType
): HtmlDocumentToPdfOptions | Omit<HtmlDocumentToPdfOptions, 'pageSelector'> {
    if (type === 'presentation') {
        return PRESENTATION_PDF_EXPORT_OPTIONS;
    }

    return DOCUMENT_PDF_EXPORT_OPTIONS;
}

export function artifactSupportsPptxExport(type: ArtifactType): type is 'presentation' {
    return type === 'presentation';
}

export function buildArtifactFileStem(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 120);
}

export function buildArtifactFileName(artifact: ParsedArtifact, extension: string): string {
    const normalizedExtension = extension.replace(/^\./, '');
    return `${buildArtifactFileStem(artifact.title) || 'artifact'}.${normalizedExtension}`;
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function wrapArtifactHtmlDocument(body: string, title: string, styles: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${styles}</style>
</head>
<body>
${body}
</body>
</html>`;
}

async function buildDocumentHtmlDocument(artifact: ParsedArtifact): Promise<string> {
    const { markdownToHtmlBody } = await import('./artifactMarkdownHtml');
    const body = sanitizeArtifactExportBodyHtml(markdownToHtmlBody(artifact.content));
    return wrapArtifactHtmlDocument(
        `<article class="artifact-markdown">${body}</article>`,
        artifact.title,
        DOCUMENT_EXPORT_STYLES
    );
}

async function preparePresentationSlideContent(artifact: ParsedArtifact): Promise<string> {
    let slideContent = artifact.content;
    if (slideContentHasChartPlaceholder(slideContent)) {
        slideContent = await renderChartsInSlideContent(slideContent);
    }

    return slideContent;
}

async function buildPresentationHtmlDocument(artifact: ParsedArtifact): Promise<string> {
    const slideContent = await preparePresentationSlideContent(artifact);
    const slidesHtml = sanitizeArtifactExportBodyHtml(buildPresentationSlidesHtml(slideContent));

    return wrapArtifactHtmlDocument(
        `<div class="artifact-slides-export">${slidesHtml}</div>`,
        artifact.title,
        PRESENTATION_EXPORT_STYLES
    );
}

export interface BuildPresentationSlideExportOptions {
    /** Called while slide HTML is being prepared so the UI can update before capture begins. */
    onPrepareProgress?: (current: number, total: number) => void;
}

/** Build one standalone HTML document per slide for reliable per-page PDF capture. */
export async function buildPresentationSlideExportDocuments(
    artifact: ParsedArtifact,
    options: BuildPresentationSlideExportOptions = {}
): Promise<string[]> {
    options.onPrepareProgress?.(0, 1);

    const slideContent = await preparePresentationSlideContent(artifact);
    const slideFragments = extractPresentationSlideFragments(slideContent);

    if (slideFragments.length === 0) {
        return [];
    }

    options.onPrepareProgress?.(0, slideFragments.length);

    return slideFragments.map((fragment) => {
        const sanitizedFragment = sanitizeArtifactExportBodyHtml(fragment);

        return wrapArtifactHtmlDocument(
            `<div class="artifact-slides-export">${sanitizedFragment}</div>`,
            artifact.title,
            PRESENTATION_EXPORT_STYLES
        );
    });
}

/** Build a standalone HTML document suitable for PDF export. */
export async function buildArtifactHtmlDocument(artifact: ParsedArtifact): Promise<string | null> {
    if (!artifact.content.trim()) {
        return null;
    }

    if (artifact.type === 'document') {
        return buildDocumentHtmlDocument(artifact);
    }

    if (artifact.type === 'presentation') {
        return buildPresentationHtmlDocument(artifact);
    }

    return null;
}
