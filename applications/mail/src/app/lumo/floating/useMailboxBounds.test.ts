import { act, fireEvent, renderHook } from '@testing-library/react';

import { MAILBOX_BOUNDS_CLASS, useMailboxBounds } from './useMailboxBounds';

const mountMainArea = (hasMarker: boolean) => {
    const mainArea = document.createElement('div');
    const mailbox = mainArea.appendChild(document.createElement('div'));
    if (hasMarker) {
        mailbox.classList.add(MAILBOX_BOUNDS_CLASS);
    }
    return { mainAreaRef: { current: mainArea }, mailbox };
};

const sizeTo = (element: HTMLElement, width: number) => {
    element.getBoundingClientRect = () => ({ width }) as DOMRect;
};

const lastResizeObserver = () => {
    const { calls, results } = jest.mocked(window.ResizeObserver).mock;
    return { onResize: calls.at(-1)![0] as () => void, observer: results.at(-1)!.value as ResizeObserver };
};

describe('useMailboxBounds', () => {
    it('stays unmeasured when the mailbox marker is missing', () => {
        const { mainAreaRef } = mountMainArea(false);

        const { result } = renderHook(() => useMailboxBounds(mainAreaRef));

        expect(result.current).toBeNull();
    });

    it('measures the marked mailbox and re-measures when the window resizes', () => {
        const { mainAreaRef, mailbox } = mountMainArea(true);
        sizeTo(mailbox, 800);
        const { result } = renderHook(() => useMailboxBounds(mainAreaRef));
        expect(result.current?.width).toBe(800);

        sizeTo(mailbox, 600);
        act(() => {
            fireEvent(window, new Event('resize'));
        });

        expect(result.current?.width).toBe(600);
    });

    it('re-measures when the mailbox itself resizes', () => {
        const { mainAreaRef, mailbox } = mountMainArea(true);
        sizeTo(mailbox, 800);
        const { result } = renderHook(() => useMailboxBounds(mainAreaRef));
        const { onResize, observer } = lastResizeObserver();
        expect(observer.observe).toHaveBeenCalledWith(mailbox);

        sizeTo(mailbox, 500);
        act(onResize);

        expect(result.current?.width).toBe(500);
    });

    it('stops measuring once unmounted', () => {
        const { mainAreaRef, mailbox } = mountMainArea(true);
        const { unmount } = renderHook(() => useMailboxBounds(mainAreaRef));
        const { observer } = lastResizeObserver();
        const measure = jest.fn(() => ({ width: 0 }) as DOMRect);
        mailbox.getBoundingClientRect = measure;

        unmount();
        fireEvent(window, new Event('resize'));

        expect(observer.disconnect).toHaveBeenCalledTimes(1);
        expect(measure).not.toHaveBeenCalled();
    });
});
