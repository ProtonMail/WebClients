// @vitest-environment jsdom
// DOMPurify drops block elements such as <h1> when it runs on happy-dom.
import { downloadHtmlAsPdf, downloadHtmlSlidesAsPdf } from '../../../util/pdf/downloadHtmlAsPdf';
import { printHtmlDocument } from '../../../util/pdf/printHtmlDocument';
import { buildDeckPdfBytes } from './artifactDeckPdf';
import { exportArtifactPdf, getArtifactPdfExportMode } from './artifactPdfExport';
import type { ParsedArtifact } from './parseArtifacts';

vi.mock('../../../util/pdf/downloadHtmlAsPdf', () => ({
    downloadHtmlAsPdf: vi.fn(async () => {}),
    downloadHtmlSlidesAsPdf: vi.fn(async () => {}),
}));
vi.mock('../../../util/pdf/printHtmlDocument', () => ({
    printHtmlDocument: vi.fn(async () => {
        return true;
    }),
}));
vi.mock('./artifactMarkdownHtml', () => ({
    markdownToHtmlBody: vi.fn(() => {
        return '<h1>Summary</h1>';
    }),
}));
vi.mock('./artifactDeckPdf', () => ({
    buildDeckPdfBytes: vi.fn(async () => {
        return new Uint8Array();
    }),
}));
vi.mock('../../../util/triggerFileDownload', () => ({
    triggerFileDownload: vi.fn(async () => {}),
}));

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

const jsonDeckArtifact: ParsedArtifact = {
    id: 'deck-2',
    type: 'presentation',
    title: 'JSON deck',
    content: JSON.stringify({ title: 'JSON deck', slides: [{ layout: 'bullets', title: 'One', bullets: ['A'] }] }),
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
        vi.clearAllMocks();
    });

    it('opens the print dialog for documents, titled after the artifact, without building a file', async () => {
        await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('print_dialog');

        expect(printHtmlDocument).toHaveBeenCalledWith(expect.stringContaining('<h1>Summary</h1>'), {
            title: 'Meeting notes',
        });
        expect(downloadHtmlAsPdf).not.toHaveBeenCalled();
    });

    it('downloads an image-page PDF when the print dialog cannot be opened', async () => {
        vi.mocked(printHtmlDocument).mockResolvedValueOnce(false);

        await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('image_fallback');
        expect(downloadHtmlAsPdf).toHaveBeenCalledWith(expect.any(String), 'Meeting notes.pdf', expect.any(Object));
    });

    describe('in the desktop shell', () => {
        afterEach(() => {
            delete window.LumoConnectors;
        });

        it('saves through the native export and skips print and image paths', async () => {
            const exportPdf = vi.fn(async () => {
                return { status: 'saved' as const };
            });
            window.LumoConnectors = { exportPdf };

            await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('native_saved');

            expect(exportPdf).toHaveBeenCalledWith(expect.stringContaining('<h1>Summary</h1>'), {
                fileName: 'Meeting notes.pdf',
                title: 'Meeting notes',
            });
            expect(printHtmlDocument).not.toHaveBeenCalled();
            expect(downloadHtmlAsPdf).not.toHaveBeenCalled();
        });

        it('reports cancelled without downloading anything', async () => {
            window.LumoConnectors = {
                exportPdf: vi.fn(async () => {
                    return { status: 'cancelled' as const };
                }),
            };

            await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('cancelled');

            expect(downloadHtmlAsPdf).not.toHaveBeenCalled();
        });

        it.each([
            ['returns failed', () => Promise.resolve({ status: 'failed' as const })],
            ['throws', () => Promise.reject(new Error('bridge error'))],
        ])('downloads an image-page PDF when the native export %s', async (_name, impl) => {
            window.LumoConnectors = { exportPdf: vi.fn(impl) };
            vi.mocked(printHtmlDocument).mockResolvedValueOnce(false);

            await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('image_fallback');
            expect(downloadHtmlAsPdf).toHaveBeenCalledWith(expect.any(String), 'Meeting notes.pdf', expect.any(Object));
        });

        it('downloads an image-page PDF when the shell has no native export', async () => {
            window.LumoConnectors = {};
            vi.mocked(printHtmlDocument).mockResolvedValueOnce(false);

            await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('image_fallback');
            expect(downloadHtmlAsPdf).toHaveBeenCalled();
        });
    });

    it('fails when neither the print dialog nor the image fallback works', async () => {
        vi.mocked(printHtmlDocument).mockResolvedValueOnce(false);
        vi.mocked(downloadHtmlAsPdf).mockRejectedValueOnce(new Error('capture failed'));

        await expect(exportArtifactPdf(documentArtifact)).resolves.toBe('failed');
    });

    it('downloads presentations in one click without opening the print dialog', async () => {
        await expect(exportArtifactPdf(presentationArtifact)).resolves.toBe('success');

        expect(downloadHtmlSlidesAsPdf).toHaveBeenCalledWith(expect.any(Array), 'Deck.pdf', expect.any(Object));
        expect(printHtmlDocument).not.toHaveBeenCalled();
    });

    it('opens the print dialog when presentation capture fails', async () => {
        vi.mocked(downloadHtmlSlidesAsPdf).mockRejectedValueOnce(new Error('capture failed'));

        await expect(exportArtifactPdf(presentationArtifact)).resolves.toBe('print_fallback');
        expect(printHtmlDocument).toHaveBeenCalledWith(expect.any(String), { title: 'Deck' });
    });

    it('fails rather than printing the raw JSON when a JSON deck PDF cannot be built', async () => {
        vi.mocked(buildDeckPdfBytes).mockRejectedValueOnce(new Error('layout failed'));

        await expect(exportArtifactPdf(jsonDeckArtifact)).resolves.toBe('failed');
        expect(printHtmlDocument).not.toHaveBeenCalled();
    });

    it('is unavailable for code and webpage artifacts', async () => {
        await expect(exportArtifactPdf({ id: 'c', type: 'code', title: 'Script', content: 'print(1)' })).resolves.toBe(
            'unavailable'
        );
    });
});
