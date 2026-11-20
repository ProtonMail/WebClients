import { renderHook } from '@testing-library/react';

import { ensureRecentPdfPageImages } from '../../services/files/pdfPageImages';
import { usePrefetchPdfPageImages } from './usePrefetchPdfPageImages';

vi.mock('../../services/files/pdfPageImages', () => ({
    ensureRecentPdfPageImages: vi.fn().mockResolvedValue(undefined),
}));

const message = (id: string, attachments: object[]) => ({ id, attachments }) as any;
const pdf = (id: string) => ({ id, filename: `${id}.pdf`, mimeType: 'application/pdf' });
const image = (id: string) => ({ id, filename: `${id}.png`, mimeType: 'image/png' });

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Force the setTimeout fallback so the test does not depend on idle scheduling.
    (globalThis as any).requestIdleCallback = undefined;
});

afterEach(() => vi.useRealTimers());

describe('usePrefetchPdfPageImages', () => {
    it('renders the pages of the conversation PDFs once the browser is idle', () => {
        renderHook(() => usePrefetchPdfPageImages([message('m1', [pdf('a'), image('i')])]));

        expect(ensureRecentPdfPageImages).not.toHaveBeenCalled();
        vi.runAllTimers();

        expect(ensureRecentPdfPageImages).toHaveBeenCalledTimes(1);
        expect(ensureRecentPdfPageImages).toHaveBeenCalledWith([expect.objectContaining({ id: 'a' })]);
    });

    it('does nothing without a PDF', () => {
        renderHook(() => usePrefetchPdfPageImages([message('m1', [image('i')])]));
        vi.runAllTimers();

        expect(ensureRecentPdfPageImages).not.toHaveBeenCalled();
    });

    it('does not run again when only the chain changes, but does when a PDF is added', () => {
        const first = [message('m1', [pdf('a')])];
        const { rerender } = renderHook(({ chain }) => usePrefetchPdfPageImages(chain), {
            initialProps: { chain: first },
        });
        vi.runAllTimers();

        rerender({ chain: [...first, message('m2', [])] });
        vi.runAllTimers();
        expect(ensureRecentPdfPageImages).toHaveBeenCalledTimes(1);

        rerender({ chain: [...first, message('m3', [pdf('b')])] });
        vi.runAllTimers();
        expect(ensureRecentPdfPageImages).toHaveBeenCalledTimes(2);
    });

    it('cancels the pending render when the conversation is left', () => {
        const { unmount } = renderHook(() => usePrefetchPdfPageImages([message('m1', [pdf('a')])]));
        unmount();
        vi.runAllTimers();

        expect(ensureRecentPdfPageImages).not.toHaveBeenCalled();
    });
});
