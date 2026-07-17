import type { Room } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDummyVideoTrack, isDummyVideoTrack, markVideoTrackDeviceBacked } from './dummyVideoTrack';

const liveKitMocks = vi.hoisted(() => {
    class LocalVideoTrack {
        source: unknown;

        mediaStreamTrack: unknown;

        userProvidedTrack: boolean;

        constructor(mediaTrack: unknown, _constraints: unknown, userProvidedTrack = true) {
            this.mediaStreamTrack = mediaTrack;
            this.userProvidedTrack = userProvidedTrack;
        }
    }

    return { LocalVideoTrack, Track: { Source: { Camera: 'camera' } } };
});

vi.mock('livekit-client', () => liveKitMocks);

const createRoom = (resolution?: { width: number; height: number }) =>
    ({ options: { videoCaptureDefaults: resolution ? { resolution } : undefined } }) as unknown as Room;

describe('dummyVideoTrack', () => {
    let capturedCanvas: HTMLCanvasElement | undefined;
    const mediaStreamTrack = { kind: 'video' } as unknown as MediaStreamTrack;

    const setCaptureStream = (videoTracks: MediaStreamTrack[]) => {
        (HTMLCanvasElement.prototype as any).captureStream = vi.fn(function (this: HTMLCanvasElement) {
            capturedCanvas = this;
            return { getVideoTracks: () => videoTracks } as unknown as MediaStream;
        });
    };

    beforeEach(() => {
        capturedCanvas = undefined;
        setCaptureStream([mediaStreamTrack]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete (HTMLCanvasElement.prototype as any).captureStream;
    });

    it('creates a camera-sourced placeholder track flagged as dummy', () => {
        const track = createDummyVideoTrack(createRoom({ width: 640, height: 480 }));

        expect(track).not.toBeNull();
        expect(track!.source).toBe('camera');
        // Wraps the canvas media track and stays user-provided so LiveKit never reacquires it.
        expect((track as any).mediaStreamTrack).toBe(mediaStreamTrack);
        expect((track as any).userProvidedTrack).toBe(true);
        expect(isDummyVideoTrack(track)).toBe(true);
    });

    it('sizes the canvas to the room capture resolution', () => {
        createDummyVideoTrack(createRoom({ width: 1280, height: 720 }));

        expect(capturedCanvas?.width).toBe(1280);
        expect(capturedCanvas?.height).toBe(720);
    });

    it('falls back to 1920x1080 when the room has no capture resolution', () => {
        createDummyVideoTrack(createRoom());

        expect(capturedCanvas?.width).toBe(1920);
        expect(capturedCanvas?.height).toBe(1080);
    });

    it('returns null when the canvas stream yields no video track', () => {
        setCaptureStream([]);

        expect(createDummyVideoTrack(createRoom())).toBeNull();
    });

    it('does not recognise null or untracked tracks as dummy', () => {
        expect(isDummyVideoTrack(null)).toBe(false);
        expect(isDummyVideoTrack({} as any)).toBe(false);
    });

    it('marks a swapped track device-backed: drops the flag and clears providedByUser', () => {
        const track = createDummyVideoTrack(createRoom());
        expect(isDummyVideoTrack(track)).toBe(true);

        markVideoTrackDeviceBacked(track!);

        // No longer a placeholder, and now device-backed so LiveKit stops the device on mute (LED off).
        expect(isDummyVideoTrack(track)).toBe(false);
        expect((track as unknown as { providedByUser: boolean }).providedByUser).toBe(false);
    });
});
