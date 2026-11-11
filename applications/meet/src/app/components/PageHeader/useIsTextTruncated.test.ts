import { act, renderHook } from '@testing-library/react';

import { useIsTextTruncated } from './useIsTextTruncated';

let notifyResize: () => void;

class ResizeObserverMock {
    constructor(callback: () => void) {
        notifyResize = callback;
    }

    observe() {}

    disconnect() {}
}

const resizeElement = (
    element: HTMLElement,
    { textRectWidths, boxWidth }: { textRectWidths: number[]; boxWidth: number }
) => {
    vi.spyOn(Range.prototype, 'getClientRects').mockReturnValue(
        textRectWidths.map((width) => new DOMRect(0, 0, width, 20)) as unknown as DOMRectList
    );
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, boxWidth, 20));
    act(() => notifyResize());
};

describe('useIsTextTruncated', () => {
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('reports truncation when the text overflows its box, even by a fraction of a pixel, and clears it once the text fits again', () => {
        const element = document.createElement('span');
        element.textContent = 'Sign in';
        const { result } = renderHook(() => useIsTextTruncated<HTMLSpanElement>());

        act(() => result.current.ref(element));

        resizeElement(element, { textRectWidths: [50], boxWidth: 100 });
        expect(result.current.isTruncated).toBe(false);

        resizeElement(element, { textRectWidths: [60, 60.5], boxWidth: 120 });
        expect(result.current.isTruncated).toBe(true);

        resizeElement(element, { textRectWidths: [120], boxWidth: 120 });
        expect(result.current.isTruncated).toBe(false);
    });
});
