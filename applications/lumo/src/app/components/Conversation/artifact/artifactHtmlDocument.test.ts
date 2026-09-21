import {
    DOCUMENT_PDF_EXPORT_OPTIONS,
    PRESENTATION_PDF_EXPORT_OPTIONS,
    PRESENTATION_PPTX_EXPORT_OPTIONS,
    artifactSupportsPdfExport,
    artifactSupportsPptxExport,
    buildArtifactFileName,
    buildArtifactHtmlDocument,
    buildPresentationSlideExportDocuments,
    getArtifactPdfExportOptions,
    wrapArtifactHtmlDocument,
} from './artifactHtmlDocument';
import type { ParsedArtifact } from './parseArtifacts';

jest.mock('./artifactMarkdownHtml', () => ({
    markdownToHtmlBody: jest.fn((markdown: string) => `<h1>Summary</h1><ul><li>Item one</li></ul><!-- ${markdown} -->`),
}));

jest.mock('./artifactPresentationHtml', () => ({
    buildPresentationSlidesHtml: (slideContent: string) => {
        return slideContent;
    },
    extractPresentationSlideFragments: (slideContent: string) => {
        return slideContent
            .split('\n')
            .map((fragment) => {
                return fragment.trim();
            })
            .filter(Boolean);
    },
}));

jest.mock('vega-embed', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('vega-interpreter', () => ({ expressionInterpreter: {} }));

describe('artifactSupportsPdfExport', () => {
    it('supports document and presentation artifacts', () => {
        expect(artifactSupportsPdfExport('document')).toBe(true);
        expect(artifactSupportsPdfExport('presentation')).toBe(true);
    });

    it('does not support code or webpage artifacts', () => {
        expect(artifactSupportsPdfExport('code')).toBe(false);
        expect(artifactSupportsPdfExport('webpage')).toBe(false);
    });
});

describe('artifactSupportsPptxExport', () => {
    it('supports presentation artifacts only', () => {
        expect(artifactSupportsPptxExport('presentation')).toBe(true);
        expect(artifactSupportsPptxExport('document')).toBe(false);
    });
});

describe('PRESENTATION_PPTX_EXPORT_OPTIONS', () => {
    it('uses the same slide viewport width as PDF export', () => {
        expect(PRESENTATION_PPTX_EXPORT_OPTIONS).toEqual({ viewportWidth: 960, scale: 1 });
    });
});

describe('buildArtifactFileName', () => {
    it('sanitizes the title and applies the extension', () => {
        const artifact: ParsedArtifact = {
            id: 'a1',
            type: 'document',
            title: 'Q1 Plan / Draft',
            content: 'hello',
        };

        expect(buildArtifactFileName(artifact, 'pdf')).toBe('q1-plan-draft.pdf');
    });
});

describe('wrapArtifactHtmlDocument', () => {
    it('wraps body content in a standalone HTML document', () => {
        const html = wrapArtifactHtmlDocument('<p>Hello</p>', 'Title', 'body { margin: 0; }');

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Title</title>');
        expect(html).toContain('<p>Hello</p>');
    });
});

describe('buildArtifactHtmlDocument', () => {
    it('strips malicious markup from document export bodies', async () => {
        const { markdownToHtmlBody } = await import('./artifactMarkdownHtml');
        jest.mocked(markdownToHtmlBody).mockReturnValueOnce('<h1>Summary</h1><img src=x onerror="alert(1)">');

        const html = await buildArtifactHtmlDocument({
            id: 'doc-xss',
            type: 'document',
            title: 'Notes',
            content: '# Summary',
        });

        expect(html).not.toMatch(/onerror/i);
        expect(html).toContain('<h1>Summary</h1>');
    });

    it('wraps document markdown in a standalone HTML document', async () => {
        const html = await buildArtifactHtmlDocument({
            id: 'doc-1',
            type: 'document',
            title: 'Meeting notes',
            content: '# Summary\n\n- Item one',
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Meeting notes</title>');
        expect(html).toContain('<h1>Summary</h1>');
        expect(html).toContain('<li>Item one</li>');
    });

    it('returns null for empty content', async () => {
        const html = await buildArtifactHtmlDocument({
            id: 'doc-2',
            type: 'document',
            title: 'Empty',
            content: '   ',
        });

        expect(html).toBeNull();
    });

    it('stacks presentation slides for export without reveal.js runtime', async () => {
        const html = await buildArtifactHtmlDocument({
            id: 'slides-1',
            type: 'presentation',
            title: 'Deck',
            content: '<section><h2>Slide 1</h2></section><section><h2>Slide 2</h2></section>',
        });

        expect(html).toContain('artifact-slides-export');
        expect(html).toContain('Slide 1');
        expect(html).toContain('Slide 2');
        expect(html).not.toContain('Reveal.initialize');
        expect(html).not.toContain('.reveal');
    });
});

describe('getArtifactPdfExportOptions', () => {
    it('uses landscape per-slide capture for presentations', () => {
        expect(getArtifactPdfExportOptions('presentation')).toEqual(PRESENTATION_PDF_EXPORT_OPTIONS);
    });

    it('uses portrait margins for documents', () => {
        expect(getArtifactPdfExportOptions('document')).toEqual(DOCUMENT_PDF_EXPORT_OPTIONS);
    });
});

describe('buildPresentationSlideExportDocuments', () => {
    it('builds one HTML document per slide fragment', async () => {
        const documents = await buildPresentationSlideExportDocuments({
            id: 'slides-1',
            type: 'presentation',
            title: 'Deck',
            content: '<section><h2>Slide 1</h2></section>\n<section><h2>Slide 2</h2></section>',
        });

        expect(documents).toHaveLength(2);
        expect(documents[0]).toContain('Slide 1');
        expect(documents[1]).toContain('Slide 2');
        expect(documents[0]).toContain('artifact-slides-export');
    });
});
