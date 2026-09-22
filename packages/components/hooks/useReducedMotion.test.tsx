import { act, renderHook } from '@testing-library/react';

import { getReducedMotion, useReducedMotion } from './useReducedMotion';

const stubMatchMedia = (matches: boolean) => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();

    const query = {
        matches,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.delete(listener);
        },
    };

    const matchMedia = jest.fn().mockReturnValue(query);

    Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMedia });

    return {
        matchMedia,
        emit: (next: boolean) => {
            query.matches = next;
            listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
        },
        listenerCount: () => listeners.size,
    };
};

const withoutMatchMedia = () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });
};

const originalMatchMedia = window.matchMedia;

afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia });
});

describe('getReducedMotion', () => {
    it('reads the preference off the media query', () => {
        stubMatchMedia(true);

        expect(getReducedMotion()).toBe(true);
    });

    it('assumes motion is welcome where the query cannot be asked', () => {
        withoutMatchMedia();

        expect(getReducedMotion()).toBe(false);
    });

    it('asks for the reduced-motion preference and no other', () => {
        const { matchMedia } = stubMatchMedia(false);

        getReducedMotion();

        expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
});

describe('useReducedMotion', () => {
    it('has the preference on the first render, so nothing animates on the way to finding out', () => {
        stubMatchMedia(true);

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(true);
    });

    it('follows the preference changing', () => {
        const { emit } = stubMatchMedia(false);

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(false);

        act(() => emit(true));

        expect(result.current).toBe(true);
    });

    it('stops listening when it goes away', () => {
        const { listenerCount } = stubMatchMedia(false);

        const { unmount } = renderHook(() => useReducedMotion());

        expect(listenerCount()).toBe(1);

        unmount();

        expect(listenerCount()).toBe(0);
    });

    it('renders where the query cannot be asked', () => {
        withoutMatchMedia();

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(false);
    });
});
