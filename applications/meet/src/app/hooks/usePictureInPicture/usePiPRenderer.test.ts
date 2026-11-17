import { renderHook } from '@testing-library/react';
import type { Participant, Track, TrackPublication } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TrackInfo } from './types';
import { usePiPRenderer } from './usePiPRenderer';

const createTrackInfo = (sid: string): TrackInfo & { track: { attach: ReturnType<typeof vi.fn> } } => {
    const mediaStreamTrack = { id: `${sid}-media` } as MediaStreamTrack;
    const track = {
        sid,
        mediaStreamTrack,
        attach: vi.fn((element: HTMLVideoElement) => {
            Object.defineProperty(element, 'srcObject', {
                value: { getTracks: () => [mediaStreamTrack] },
                writable: true,
                configurable: true,
            });
            return element;
        }),
        detach: vi.fn(),
    } as unknown as Track & { attach: ReturnType<typeof vi.fn> };

    return {
        kind: 'track',
        track,
        participant: { identity: sid, isLocal: false } as Participant,
        publication: { isEnabled: true } as TrackPublication,
        isScreenShare: false,
    };
};

const createCanvas = () => {
    const context = new Proxy({}, { get: (target: Record<string, unknown>, key: string) => target[key] ?? vi.fn() });
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    return canvas;
};

describe('usePiPRenderer', () => {
    let pendingFrames: Map<number, FrameRequestCallback>;
    let nextFrameId: number;

    const runFrames = (count: number) => {
        for (let i = 0; i < count; i++) {
            const frames = [...pendingFrames.values()];
            pendingFrames.clear();
            frames.forEach((callback) => callback(performance.now()));
        }
    };

    beforeEach(() => {
        pendingFrames = new Map();
        nextFrameId = 1;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            const id = nextFrameId++;
            pendingFrames.set(id, callback);
            return id;
        });
        vi.stubGlobal('cancelAnimationFrame', (id: number) => {
            pendingFrames.delete(id);
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('keeps a single loop when rendering restarts with another track list', () => {
        const { result } = renderHook(() => usePiPRenderer());
        const canvas = createCanvas();
        const screenShare = createTrackInfo('screen');
        const camera = createTrackInfo('camera');

        result.current.startRendering(canvas, [screenShare, camera], [], {});
        result.current.startRendering(canvas, [screenShare], [], {});
        runFrames(10);

        expect(pendingFrames.size).toBe(1);
        expect(camera.track.attach).toHaveBeenCalledTimes(1);
        expect(screenShare.track.attach).toHaveBeenCalledTimes(1);
    });

    it('stops every loop it started', () => {
        const { result } = renderHook(() => usePiPRenderer());
        const canvas = createCanvas();
        const camera = createTrackInfo('camera');

        result.current.startRendering(canvas, [camera], [], {});
        result.current.startRendering(canvas, [camera], [], {});
        result.current.stopRendering();
        runFrames(10);

        expect(pendingFrames.size).toBe(0);
        expect(camera.track.attach).toHaveBeenCalledTimes(1);
    });

    it('detaches the track from the element it attached when the track leaves the list', () => {
        const { result } = renderHook(() => usePiPRenderer());
        const canvas = createCanvas();
        const screenShare = createTrackInfo('screen');
        const camera = createTrackInfo('camera');

        result.current.startRendering(canvas, [screenShare, camera], [], {});
        const cameraElement = camera.track.attach.mock.calls[0][0];
        result.current.startRendering(canvas, [screenShare], [], {});

        expect(camera.track.detach).toHaveBeenCalledWith(cameraElement);
        expect(screenShare.track.detach).not.toHaveBeenCalled();
    });

    it('detaches every track when rendering stops', () => {
        const { result } = renderHook(() => usePiPRenderer());
        const canvas = createCanvas();
        const screenShare = createTrackInfo('screen');
        const camera = createTrackInfo('camera');

        result.current.startRendering(canvas, [screenShare, camera], [], {});
        result.current.stopRendering();

        expect(screenShare.track.detach).toHaveBeenCalledWith(screenShare.track.attach.mock.calls[0][0]);
        expect(camera.track.detach).toHaveBeenCalledWith(camera.track.attach.mock.calls[0][0]);
    });
});
