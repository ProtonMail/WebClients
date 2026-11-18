import { act, renderHook } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { useVideoAutoPlay } from './useVideoAutoPlay';

vi.mock('@proton/unleash/useFlag');

describe('useVideoAutoPlay', () => {
    let mockVideoElement: Partial<HTMLVideoElement>;
    let mockAddEventListener: MockInstance<
        (
            ...args: [
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | AddEventListenerOptions | undefined,
            ]
        ) => void
    >;
    let mockRemoveEventListener: MockInstance<
        (
            ...args: [
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | EventListenerOptions | undefined,
            ]
        ) => void
    >;

    beforeEach(() => {
        mockVideoElement = {
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            currentTime: 0,
            paused: true,
            muted: false,
        };

        mockAddEventListener = vi.spyOn(document, 'addEventListener');
        mockRemoveEventListener = vi.spyOn(document, 'removeEventListener');

        Object.defineProperty(document, 'hidden', {
            writable: true,
            value: false,
        });

        Object.defineProperty(navigator, 'userActivation', {
            writable: true,
            value: { hasBeenActive: false },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        mockAddEventListener.mockRestore();
        mockRemoveEventListener.mockRestore();
    });

    it('returns video props', () => {
        const { result } = renderHook(() => useVideoAutoPlay());

        expect(result.current).toEqual({
            videoRef: expect.any(Object),
            handleCanPlay: expect.any(Function),
            muted: true,
        });
    });

    it('detects prior user interaction from userActivation API', () => {
        Object.defineProperty(navigator, 'userActivation', {
            writable: true,
            value: { hasBeenActive: true },
        });

        const { result } = renderHook(() => useVideoAutoPlay());

        expect(result.current?.muted).toBe(false);
    });

    it('defaults to muted when no prior user interaction', () => {
        const { result } = renderHook(() => useVideoAutoPlay());

        expect(result.current?.muted).toBe(true);
    });

    it('sets up visibility change listener', () => {
        renderHook(() => useVideoAutoPlay());

        expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('cleans up visibility change listener on unmount', () => {
        const { unmount } = renderHook(() => useVideoAutoPlay());

        unmount();

        expect(mockRemoveEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('attempts muted autoplay when tab is active and no user interaction', async () => {
        const { result } = renderHook(() => useVideoAutoPlay());

        Object.defineProperty(result.current!.videoRef, 'current', {
            writable: true,
            value: mockVideoElement,
        });

        await act(async () => {
            result.current?.handleCanPlay();
        });

        expect(mockVideoElement.muted).toBe(true);
        expect(mockVideoElement.play).toHaveBeenCalled();
    });

    it('attempts unmuted autoplay when tab is active and user has interacted', async () => {
        Object.defineProperty(navigator, 'userActivation', {
            writable: true,
            value: { hasBeenActive: true },
        });

        const { result } = renderHook(() => useVideoAutoPlay());

        Object.defineProperty(result.current!.videoRef, 'current', {
            writable: true,
            value: mockVideoElement,
        });

        await act(async () => {
            result.current?.handleCanPlay();
        });

        expect(mockVideoElement.muted).toBe(false);
        expect(mockVideoElement.play).toHaveBeenCalled();
    });

    it('handles autoplay failure gracefully', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const mockPlay = vi.fn().mockRejectedValue(new Error('Autoplay failed'));
        mockVideoElement.play = mockPlay;

        const { result } = renderHook(() => useVideoAutoPlay());

        Object.defineProperty(result.current!.videoRef, 'current', {
            writable: true,
            value: mockVideoElement,
        });

        await act(async () => {
            result.current?.handleCanPlay();
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith('Autoplay failed:', expect.any(Error));
        consoleWarnSpy.mockRestore();
    });

    it('does not attempt autoplay when tab is not active', async () => {
        Object.defineProperty(document, 'hidden', {
            writable: true,
            value: true,
        });

        const { result } = renderHook(() => useVideoAutoPlay());

        Object.defineProperty(result.current!.videoRef, 'current', {
            writable: true,
            value: mockVideoElement,
        });

        await act(async () => {
            result.current?.handleCanPlay();
        });

        expect(mockVideoElement.play).not.toHaveBeenCalled();
    });

    it('only attempts autoplay once per video', async () => {
        const { result } = renderHook(() => useVideoAutoPlay());

        Object.defineProperty(result.current!.videoRef, 'current', {
            writable: true,
            value: mockVideoElement,
        });

        await act(async () => {
            result.current?.handleCanPlay();
        });

        await act(async () => {
            result.current?.handleCanPlay();
        });

        expect(mockVideoElement.play).toHaveBeenCalledTimes(1);
    });

    it('updates tab active state when visibility changes', () => {
        renderHook(() => useVideoAutoPlay());

        const visibilityCall = mockAddEventListener.mock.calls.find((call: any[]) => call[0] === 'visibilitychange');
        const visibilityHandler = visibilityCall?.[1] as () => void;

        expect(visibilityHandler).toBeDefined();

        Object.defineProperty(document, 'hidden', {
            writable: true,
            value: true,
        });

        act(() => {
            visibilityHandler();
        });

        Object.defineProperty(document, 'hidden', {
            writable: true,
            value: false,
        });

        act(() => {
            visibilityHandler();
        });
    });
});
