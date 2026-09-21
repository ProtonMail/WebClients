import { buildArtifactFileForSave } from './artifactFileBytes';
import type { ParsedArtifact } from './parseArtifacts';

jest.mock('../../../util/pdf/htmlDocumentToPdfBytes', () => {
    return {
        htmlDocumentToPdfBytes: jest.fn(async () => {
            return new ArrayBuffer(8);
        }),
        htmlSlideDocumentsToPdfBytes: jest.fn(async () => {
            return new ArrayBuffer(8);
        }),
    };
});

jest.mock('../../../util/pptx/htmlSlidesToPptxBytes', () => {
    return {
        htmlSlidesToPptxBytes: jest.fn(async () => {
            return new ArrayBuffer(8);
        }),
    };
});

jest.mock('./artifactMarkdownPlainText', () => {
    return {
        markdownToPlainText: jest.fn((markdown: string) => {
            return `Plain: ${markdown.replace(/^#\s+/m, '')}`;
        }),
    };
});

jest.mock('./artifactHtmlDocument', () => {
    return {
        buildArtifactFileName: jest.fn((artifact: { title: string }, extension: string) => {
            return `${artifact.title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
        }),
        buildArtifactHtmlDocument: jest.fn(async () => {
            return '<html><body>doc</body></html>';
        }),
        buildPresentationSlideExportDocuments: jest.fn(async () => {
            return ['<html><body><section>slide</section></body></html>'];
        }),
        getArtifactPdfExportOptions: jest.fn(() => {
            return { viewportWidth: 794, pageMarginPt: 54 };
        }),
        PRESENTATION_PDF_EXPORT_OPTIONS: { viewportWidth: 960, orientation: 'landscape', scale: 1 },
        PRESENTATION_PPTX_EXPORT_OPTIONS: { viewportWidth: 960, scale: 1 },
    };
});

describe('buildArtifactFileForSave', () => {
    const documentArtifact: ParsedArtifact = {
        id: 'doc-1',
        type: 'document',
        title: 'Teen Vaping Essay',
        content: '# Title\n\nBody text',
    };

    const presentationArtifact: ParsedArtifact = {
        id: 'deck-1',
        type: 'presentation',
        title: 'Quarterly Review',
        content: '<section><h2>Intro</h2></section>',
    };

    it('builds markdown and rendered plain-text files from document content', async () => {
        const { markdownToPlainText } = jest.requireMock('./artifactMarkdownPlainText');
        const markdown = await buildArtifactFileForSave(documentArtifact, 'md');
        const plainText = await buildArtifactFileForSave(documentArtifact, 'txt');

        expect(markdown.fileName).toBe('teen-vaping-essay.md');
        expect(markdown.mimeType).toBe('text/markdown');
        expect(markdown.data).toBe(documentArtifact.content);

        expect(markdownToPlainText).toHaveBeenCalledWith(documentArtifact.content);
        expect(plainText.fileName).toBe('teen-vaping-essay.txt');
        expect(plainText.mimeType).toBe('text/plain');
        expect(plainText.data).toBe('Plain: Title\n\nBody text');
    });

    it('builds PDF bytes for documents and presentations', async () => {
        const { htmlDocumentToPdfBytes, htmlSlideDocumentsToPdfBytes } = jest.requireMock(
            '../../../util/pdf/htmlDocumentToPdfBytes'
        );

        await buildArtifactFileForSave(documentArtifact, 'pdf');
        await buildArtifactFileForSave(presentationArtifact, 'pdf');

        expect(htmlDocumentToPdfBytes).toHaveBeenCalledTimes(1);
        expect(htmlSlideDocumentsToPdfBytes).toHaveBeenCalledTimes(1);
    });

    it('builds PPTX bytes for presentations', async () => {
        const { htmlSlidesToPptxBytes } = jest.requireMock('../../../util/pptx/htmlSlidesToPptxBytes');

        const prepared = await buildArtifactFileForSave(presentationArtifact, 'pptx');

        expect(htmlSlidesToPptxBytes).toHaveBeenCalledTimes(1);
        expect(prepared.fileName).toBe('quarterly-review.pptx');
        expect(prepared.mimeType).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });

    it('rejects unsupported format and artifact type combinations', async () => {
        await expect(buildArtifactFileForSave(documentArtifact, 'pptx')).rejects.toThrow(
            'Format "pptx" is not supported for document artifacts.'
        );
        await expect(buildArtifactFileForSave(presentationArtifact, 'md')).rejects.toThrow(
            'Format "md" is not supported for presentation artifacts.'
        );
    });
});
