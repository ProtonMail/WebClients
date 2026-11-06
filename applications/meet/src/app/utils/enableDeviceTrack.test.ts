import type { LocalParticipant, LocalTrack } from 'livekit-client';
import { ParticipantEvent, Track } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { enableDeviceTrack, waitForPendingDeviceTrack } from './enableDeviceTrack';

const createTrack = () => ({ stop: vi.fn() }) as unknown as LocalTrack;

const createParticipant = ({ tracks = [createTrack()], published = false } = {}) => {
    const mocks = {
        getTrackPublication: vi.fn(() => (published ? {} : undefined)),
        setCameraEnabled: vi.fn().mockResolvedValue(undefined),
        setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
        createTracks: vi.fn().mockResolvedValue(tracks),
        publishTrack: vi.fn().mockResolvedValue(undefined),
        emit: vi.fn(),
    };
    return { participant: mocks as unknown as LocalParticipant, mocks };
};

describe('enableDeviceTrack', () => {
    it('creates and publishes the microphone track', async () => {
        const track = createTrack();
        const { participant, mocks } = createParticipant({ tracks: [track] });
        const options = { echoCancellation: true };

        const isPublished = await enableDeviceTrack(
            participant,
            { source: Track.Source.Microphone, options },
            () => false
        );

        expect(isPublished).toBe(true);
        expect(mocks.createTracks).toHaveBeenCalledWith({ audio: options });
        expect(mocks.publishTrack).toHaveBeenCalledWith(track);
        expect(track.stop).not.toHaveBeenCalled();
    });

    it('stops instead of publishing the track of a device that answers after the user left', async () => {
        const track = createTrack();
        const { participant, mocks } = createParticipant({ tracks: [track] });
        let hasLeft = false;
        mocks.createTracks.mockImplementation(async () => {
            hasLeft = true;
            return [track];
        });

        const isPublished = await enableDeviceTrack(
            participant,
            { source: Track.Source.Camera, options: { deviceId: { exact: 'camera-1' } } },
            () => hasLeft
        );

        expect(isPublished).toBe(false);
        expect(mocks.createTracks).toHaveBeenCalledWith({ video: { deviceId: { exact: 'camera-1' } } });
        expect(mocks.publishTrack).not.toHaveBeenCalled();
        expect(track.stop).toHaveBeenCalled();
    });

    it('stops the track when publishing fails', async () => {
        const track = createTrack();
        const { participant, mocks } = createParticipant({ tracks: [track] });
        const error = new Error('cannot publish track when not connected');
        mocks.publishTrack.mockRejectedValue(error);

        await expect(enableDeviceTrack(participant, { source: Track.Source.Microphone }, () => false)).rejects.toBe(
            error
        );
        expect(track.stop).toHaveBeenCalled();
    });

    it('reports a device that fails after the user left as stopped, not as an error', async () => {
        const { participant, mocks } = createParticipant();
        mocks.createTracks.mockRejectedValue(new DOMException('Could not start audio source', 'NotReadableError'));

        const enabling = enableDeviceTrack(participant, { source: Track.Source.Microphone }, () => true);
        const waiting = waitForPendingDeviceTrack(participant, Track.Source.Microphone);

        await expect(enabling).resolves.toBe(false);
        await expect(waiting).resolves.toBe(true);
        expect(mocks.emit).not.toHaveBeenCalled();
    });

    it('reports a publish that fails after the user left as stopped, not as an error', async () => {
        const track = createTrack();
        const { participant, mocks } = createParticipant({ tracks: [track] });
        let hasLeft = false;
        mocks.publishTrack.mockImplementation(async () => {
            hasLeft = true;
            throw new Error('cannot publish track when not connected');
        });

        await expect(enableDeviceTrack(participant, { source: Track.Source.Microphone }, () => hasLeft)).resolves.toBe(
            false
        );
        expect(track.stop).toHaveBeenCalled();
    });

    it('unmutes an already published track the way LiveKit does', async () => {
        const { participant, mocks } = createParticipant({ published: true });

        const isPublished = await enableDeviceTrack(
            participant,
            { source: Track.Source.Camera, options: { deviceId: 'camera-1' } },
            () => true
        );

        expect(isPublished).toBe(true);
        expect(mocks.setCameraEnabled).toHaveBeenCalledWith(true, { deviceId: 'camera-1' });
        expect(mocks.createTracks).not.toHaveBeenCalled();
    });

    it('reports a device that fails to start the way LiveKit does', async () => {
        const { participant, mocks } = createParticipant();
        const error = new DOMException('Could not start video source', 'NotReadableError');
        mocks.createTracks.mockRejectedValue(error);

        await expect(enableDeviceTrack(participant, { source: Track.Source.Camera }, () => false)).rejects.toBe(error);
        expect(mocks.emit).toHaveBeenCalledWith(ParticipantEvent.MediaDevicesError, error, 'videoinput');
    });

    it('lets other enables of the source wait for the track it is still starting', async () => {
        const track = createTrack();
        const { participant, mocks } = createParticipant({ tracks: [track] });
        let answerDevice = () => {};
        mocks.createTracks.mockImplementation(() => new Promise((resolve) => (answerDevice = () => resolve([track]))));

        const enabling = enableDeviceTrack(participant, { source: Track.Source.Microphone }, () => false);
        let hasWaited = false;
        const waiting = waitForPendingDeviceTrack(participant, Track.Source.Microphone).then(() => {
            hasWaited = true;
        });
        await vi.waitFor(() => expect(mocks.createTracks).toHaveBeenCalled());
        expect(hasWaited).toBe(false);

        answerDevice();
        await Promise.all([enabling, waiting]);
        expect(mocks.publishTrack).toHaveBeenCalledWith(track);
        expect(hasWaited).toBe(true);
    });

    it('tells the enables waiting for it when it stopped the track because the user left', async () => {
        const track = createTrack();
        const { participant, mocks } = createParticipant({ tracks: [track] });
        let answerDevice = () => {};
        mocks.createTracks.mockImplementation(() => new Promise((resolve) => (answerDevice = () => resolve([track]))));

        const enabling = enableDeviceTrack(participant, { source: Track.Source.Microphone }, () => true);
        const waiting = waitForPendingDeviceTrack(participant, Track.Source.Microphone);
        await vi.waitFor(() => expect(mocks.createTracks).toHaveBeenCalled());

        answerDevice();
        await expect(enabling).resolves.toBe(false);
        await expect(waiting).resolves.toBe(true);
        await expect(waitForPendingDeviceTrack(participant, Track.Source.Microphone)).resolves.toBe(false);
    });

    it('does not wait for another source', async () => {
        const { participant, mocks } = createParticipant();
        mocks.createTracks.mockReturnValue(new Promise(() => {}));

        void enableDeviceTrack(participant, { source: Track.Source.Microphone }, () => false);

        await expect(waitForPendingDeviceTrack(participant, Track.Source.Camera)).resolves.toBe(false);
    });
});
