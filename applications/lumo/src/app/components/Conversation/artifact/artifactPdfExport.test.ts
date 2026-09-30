import { downloadHtmlAsPdf, downloadHtmlSlidesAsPdf } from '../../../util/pdf/downloadHtmlAsPdf';
import { printHtmlDocument } from '../../../util/pdf/printHtmlDocument';
import { exportArtifactPdf, getArtifactPdfExportMode } from './artifactPdfExport';
import type { ParsedArtifact } from './parseArtifacts';

jest.mock('../../../util/pdf/downloadHtmlAsPdf', () => ({
    downloadHtmlAsPdf: jest.fn(async () => {}),
    downloadHtmlSlidesAsPdf: jest.fn(async () => {}),
}));
jest.mock('../../../util/pdf/printHtmlDocument', () => ({
    printHtmlDocument: jest.fn(async () => {
        return true;
    }),
}));
jest.mock('./artifactMarkdownHtml', () => ({
    markdownToHtmlBody: jest.fn(() => {
        return '<h1>Summary</h1>';
    }),
}));
jest.mock('vega-embed', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('vega-interpreter', () => ({ expressionInterpreter: {} }));

const documentArtifact: ParsedArtifact = {
    id: 'doc-1',
    type: 'document',
    title: 'Meeting notes',
    content: '# Summary',
};

const presentationArtifact: ParsedArtifact = {
    id: 'deck-1',
    type: 'presentation',
    title: 'Deck',
    content: '<section><h2>One</h2></section>',
};

describe('getArtifactPdfExportMode', () => {
    it('prints documents, downloads presentations, and offers nothing else', () => {
        expect(getArtifactPdfExportMode('document')).toBe('print');
        expect(getArtifactPdfExportMode('presentation')).toBe('download');
        expect(getArtifactPdfExportMode('code')).toBeUndefined();
        expect(getArtifactPdfExportMode('webpage')).toBeUndefined();
    });
});

describe('exportArtifactPdf', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('opens the print dialog for documents, titled after the artifact, without building a file', async () => {
        await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('print_dialog');

        expect(printHtmlDocument).toHaveBeenCalledWith(expect.stringContaining('<h1>Summary</h1>'), {
            title: 'Meeting notes',
        });
        expect(downloadHtmlAsPdf).not.toHaveBeenCalled();
    });

    it('downloads an image-page PDF when the print dialog cannot be opened', async () => {
        jest.mocked(printHtmlDocument).mockResolvedValueOnce(false);

        await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('image_fallback');
        expect(downloadHtmlAsPdf).toHaveBeenCalledWith(expect.any(String), 'Meeting notes.pdf', expect.any(Object));
    });

    it('fails when neither the print dialog nor the image fallback works', async () => {
        jest.mocked(printHtmlDocument).mockResolvedValueOnce(false);
        jest.mocked(downloadHtmlAsPdf).mockRejectedValueOnce(new Error('capture failed'));

        await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('failed');
    });

    it('downloads presentations in one click without opening the print dialog', async () => {
        await expect(exportArtifactPdf(presentationArtifact)).resolves.toBe('success');

        expect(downloadHtmlSlidesAsPdf).toHaveBeenCalledWith(expect.any(Array), 'Deck.pdf', expect.any(Object));
        expect(printHtmlDocument).not.toHaveBeenCalled();
    });

    it('opens the print dialog when presentation capture fails', async () => {
        jest.mocked(downloadHtmlSlidesAsPdf).mockRejectedValueOnce(new Error('capture failed'));

        await expect(exportArtifactPdf(presentationArtifact)).resolves.toBe('print_fallback');
        expect(printHtmlDocument).toHaveBeenCalledWith(expect.any(String), { title: 'Deck' });
    });

    it('is unavailable for code and webpage artifacts', async () => {
        await expect(exportArtifactPdf({ id: 'c', type: 'code', title: 'Script', content: 'print(1)' })).resolves.toBe(
            'unavailable'
        );
    });
});
