import { createRef } from 'react';

import { renderHook } from '@testing-library/react-hooks';

import createScrollIntoView from '@proton/shared/lib/helpers/createScrollIntoView';

import useScrollIntoView from './useScrollIntoView';

jest.mock('@proton/shared/lib/helpers/createScrollIntoView', () => jest.fn());

const mockedCreateScrollIntoView = createScrollIntoView as jest.MockedFunction<typeof createScrollIntoView>;

describe('useScrollIntoView()', () => {
    let cancel: jest.Mock;
    let target: HTMLDivElement;
    let scroller: HTMLDivElement;

    beforeEach(() => {
        jest.useFakeTimers();

        cancel = jest.fn();
        mockedCreateScrollIntoView.mockReturnValue(cancel);

        // jsdom does no layout, so the scroll parent has to be told it overflows.
        scroller = document.createElement('div');
        scroller.style.overflow = 'auto';
        Object.defineProperty(scroller, 'scrollHeight', { value: 200, configurable: true });
        Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true });

        target = document.createElement('div');
        scroller.appendChild(target);
        document.body.appendChild(scroller);
    });

    afterEach(() => {
        jest.useRealTimers();
        document.body.innerHTML = '';
    });

    const render = (enabled: boolean, retriggerKey?: string, ref = createRef<HTMLElement>()) => {
        Object.defineProperty(ref, 'current', { value: target, writable: true });
        return renderHook(({ key }: { key?: string }) => useScrollIntoView(ref, enabled, key), {
            initialProps: { key: retriggerKey },
        });
    };

    it('scrolls to the target within its scroll parent', () => {
        render(true);

        expect(mockedCreateScrollIntoView).toHaveBeenCalledTimes(1);
        expect(mockedCreateScrollIntoView).toHaveBeenCalledWith(target, scroller, true, 0);
    });

    it('passes the scroll margin as the offset', () => {
        target.style.scrollMarginTop = '20px';

        render(true);

        expect(mockedCreateScrollIntoView).toHaveBeenCalledWith(target, scroller, true, 20);
    });

    it('does nothing when disabled', () => {
        render(false);

        expect(mockedCreateScrollIntoView).not.toHaveBeenCalled();
    });

    it('does nothing without an element', () => {
        renderHook(() => useScrollIntoView(createRef<HTMLElement>(), true));

        expect(mockedCreateScrollIntoView).not.toHaveBeenCalled();
    });

    it.each(['wheel', 'touchmove', 'keydown', 'mousedown'])('stops scrolling on %s', (event) => {
        render(true);
        expect(cancel).not.toHaveBeenCalled();

        window.dispatchEvent(new Event(event));

        expect(cancel).toHaveBeenCalled();
    });

    it('stops scrolling once the maximum duration has elapsed', () => {
        render(true);
        expect(cancel).not.toHaveBeenCalled();

        jest.advanceTimersByTime(10_000);

        expect(cancel).toHaveBeenCalled();
    });

    it('stops scrolling on unmount', () => {
        const { unmount } = render(true);

        unmount();

        expect(cancel).toHaveBeenCalled();
    });

    it('stops listening once cancelled', () => {
        render(true);

        window.dispatchEvent(new Event('wheel'));
        window.dispatchEvent(new Event('wheel'));

        expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('stops listening once unmounted', () => {
        const { unmount } = render(true);
        unmount();
        cancel.mockClear();

        window.dispatchEvent(new Event('wheel'));

        expect(cancel).not.toHaveBeenCalled();
    });

    it('scrolls again when the retrigger key changes', () => {
        const { rerender } = render(true, 'a');
        expect(mockedCreateScrollIntoView).toHaveBeenCalledTimes(1);

        rerender({ key: 'b' });

        expect(cancel).toHaveBeenCalled();
        expect(mockedCreateScrollIntoView).toHaveBeenCalledTimes(2);
    });
});
