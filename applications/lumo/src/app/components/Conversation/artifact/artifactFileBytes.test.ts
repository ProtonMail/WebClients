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

jest.mock('../../LumoMarkdown/vega/renderVegaSpecToSvg', () => ({
    renderVegaSpecToPng: jest.fn(),
    renderVegaSpecToSvg: jest.fn(),
}));
jest.mock('../../../util/docx/markdownToDocx', () => {
    return {
        DOCX_MIME_TYPE: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        markdownToDocxBlob: jest.fn(async () => {
            return new Blob(['docx']);
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

    it('builds a Word document from document markdown', async () => {
        const { markdownToDocxBlob } = jest.requireMock('../../../util/docx/markdownToDocx');

        const prepared = await buildArtifactFileForSave(documentArtifact, 'docx');

        expect(markdownToDocxBlob).toHaveBeenCalledWith(documentArtifact.content, {
            title: 'Teen Vaping Essay',
            creator: 'Lumo',
            localImages: new Map(),
        });
        expect(prepared.fileName).toBe('teen-vaping-essay.docx');
        expect(prepared.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('gives Word charts as embedded images and chat cards as a quote, not raw fences (D12)', async () => {
        const { markdownToDocxBlob } = jest.requireMock('../../../util/docx/markdownToDocx');
        const { renderVegaSpecToPng } = jest.requireMock('../../LumoMarkdown/vega/renderVegaSpecToSvg');
        const png = { data: new Uint8Array([1]), width: 640, height: 360 };
        renderVegaSpecToPng.mockResolvedValueOnce(png);
        const content =
            '# Report\n\n```vega-lite\n{"title":"Sales","data":{"values":[{"q":"Q1","v":3}]},"mark":"bar"}\n```\n\n' +
            '```card\n{"type":"finding","title":"Takeaway","body":"Up."}\n```\n';

        await buildArtifactFileForSave({ ...documentArtifact, content }, 'docx');

        const [markdown, options] = markdownToDocxBlob.mock.calls.at(-1);
        const [key] = Array.from((options.localImages as Map<string, unknown>).keys());
        expect(markdown).toBe(`# Report\n\n![Sales](${key})\n\n> **Takeaway**: Up.\n`);
        expect(options.localImages.get(key)).toBe(png);
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
        await expect(buildArtifactFileForSave(presentationArtifact, 'docx')).rejects.toThrow(
            'Format "docx" is not supported for presentation artifacts.'
        );
        await expect(buildArtifactFileForSave(presentationArtifact, 'md')).rejects.toThrow(
            'Format "md" is not supported for presentation artifacts.'
        );
    });
});
