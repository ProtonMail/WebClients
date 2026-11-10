import { attachmentDataCache } from '../attachmentDataCache';
import { ensureRecentPdfPageImages } from './pdfPageImages';

const processFile = jest.fn();
jest.mock('../fileProcessingService', () => ({
    FileProcessingService: { getShared: () => ({ processFile }) },
}));

const pdf = (id: string, extra: object = {}) =>
    ({
        id,
        filename: `${id}.pdf`,
        mimeType: 'application/pdf',
        uploadedAt: '2026-01-01',
        data: new Uint8Array([1, 2, 3]),
        ...extra,
    }) as any;

const page = (n: number) => ({ page: n, data: new Uint8Array([n]) });

beforeEach(() => {
    processFile.mockReset();
    attachmentDataCache.clear();
});

describe('ensureRecentPdfPageImages', () => {
    it('renders the pages of a PDF that has none and keeps them in the cache only', async () => {
        processFile.mockResolvedValue({ type: 'text', content: '', pageImages: [page(2)] });

        await ensureRecentPdfPageImages([pdf('a')]);

        expect(processFile).toHaveBeenCalledWith(expect.any(File), {
            pdfPagesOnly: true,
            fileData: expect.any(ArrayBuffer),
            transferFileData: true,
        });
        expect(attachmentDataCache.getPageImages('a')).toEqual([page(2)]);
    });

    it('does not render again a PDF whose pages are cached, even when it has no figures', async () => {
        processFile.mockResolvedValue({ type: 'text', content: '' });

        await ensureRecentPdfPageImages([pdf('a')]);
        await ensureRecentPdfPageImages([pdf('a')]);

        expect(processFile).toHaveBeenCalledTimes(1);
        expect(attachmentDataCache.getPageImages('a')).toEqual([]);
    });

    it('stops rendering older PDFs once the page budget is covered', async () => {
        attachmentDataCache.setPageImages('new', [1, 2, 3, 4, 5].map(page));

        await ensureRecentPdfPageImages([pdf('old'), pdf('new')]);

        expect(processFile).not.toHaveBeenCalled();
    });

    it('leaves a PDF as text only when rendering fails', async () => {
        processFile.mockRejectedValue(new Error('boom'));
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(ensureRecentPdfPageImages([pdf('a')])).resolves.toBeUndefined();
        expect(attachmentDataCache.getPageImages('a')).toBeUndefined();
    });
});

describe('ensureRecentPdfPageImages on a conversation of text-only PDFs', () => {
    it('stops after a bounded number of PDFs, however many the history holds', async () => {
        processFile.mockResolvedValue({ type: 'text', content: '' });
        const history = Array.from({ length: 30 }, (_, i) => pdf(`pdf-${i}`));

        await ensureRecentPdfPageImages(history);
        expect(processFile).toHaveBeenCalledTimes(5);

        // They are cached as empty now: counted as processed, so the next walk renders nothing more.
        await ensureRecentPdfPageImages(history);
        expect(processFile).toHaveBeenCalledTimes(5);
    });

    it('stops waiting after maxWaitMs and lets rendering finish in the background', async () => {
        jest.useFakeTimers();
        let finish!: (value: unknown) => void;
        processFile.mockReturnValue(new Promise((resolve) => (finish = resolve)));

        const waited = ensureRecentPdfPageImages([pdf('slow')], { maxWaitMs: 3000 });
        await jest.advanceTimersByTimeAsync(3000);
        await expect(waited).resolves.toBeUndefined();
        expect(attachmentDataCache.getPageImages('slow')).toBeUndefined();

        finish({ type: 'text', content: '', pageImages: [page(1)] });
        await jest.advanceTimersByTimeAsync(0);
        expect(attachmentDataCache.getPageImages('slow')).toEqual([page(1)]);
        jest.useRealTimers();
    });
});
