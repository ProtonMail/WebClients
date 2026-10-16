import { logger } from '@protontech/logger';
import type { LocalAudioTrack } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { isMicrophoneOnDevice } from './isMicrophoneOnDevice';

vi.mock('@protontech/logger', () => ({
    logger: { warn: vi.fn() },
}));

const HEADSET_ID = 'headset';
const BUILT_IN_ID = 'built-in';

const createTrack = ({
    requestedDeviceId,
    capturedDeviceId,
}: {
    requestedDeviceId?: ConstrainDOMString;
    capturedDeviceId: string | undefined;
}) => {
    const getDeviceId = vi.fn().mockResolvedValue(capturedDeviceId);
    const track = { constraints: { deviceId: requestedDeviceId }, getDeviceId } as unknown as LocalAudioTrack;

    return { track, getDeviceId };
};

describe('isMicrophoneOnDevice', () => {
    it('is on the device the capture was opened on', async () => {
        const { track } = createTrack({ requestedDeviceId: { exact: HEADSET_ID }, capturedDeviceId: HEADSET_ID });

        expect(await isMicrophoneOnDevice(track, HEADSET_ID)).toBe(true);
    });

    it('matches a capture opened on the OS default through its normalised id', async () => {
        const { track, getDeviceId } = createTrack({ capturedDeviceId: BUILT_IN_ID });

        expect(await isMicrophoneOnDevice(track, BUILT_IN_ID)).toBe(true);
        expect(getDeviceId).toHaveBeenCalledWith();
    });

    it('is not on a device when the OS default cannot be resolved', async () => {
        const { track } = createTrack({ capturedDeviceId: undefined });

        expect(await isMicrophoneOnDevice(track, BUILT_IN_ID)).toBe(false);
    });

    it('is not on a device when resolving the captured one throws, so the switch still runs', async () => {
        const { track, getDeviceId } = createTrack({ capturedDeviceId: BUILT_IN_ID });
        const error = new DOMException('', 'NotAllowedError');
        getDeviceId.mockRejectedValue(error);

        expect(await isMicrophoneOnDevice(track, BUILT_IN_ID)).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(String), error, { deviceId: BUILT_IN_ID });
    });

    it('is not on another device the capture is using', async () => {
        const { track } = createTrack({ requestedDeviceId: { exact: HEADSET_ID }, capturedDeviceId: HEADSET_ID });

        expect(await isMicrophoneOnDevice(track, BUILT_IN_ID)).toBe(false);
    });

    it('is not on the device a switch failed to move it to, so the switch is retried', async () => {
        const { track } = createTrack({ requestedDeviceId: { exact: HEADSET_ID }, capturedDeviceId: BUILT_IN_ID });

        expect(await isMicrophoneOnDevice(track, HEADSET_ID)).toBe(false);
    });

    it('is not on its current device while a switch away from it is deferred until unmute', async () => {
        const { track } = createTrack({ requestedDeviceId: { exact: HEADSET_ID }, capturedDeviceId: BUILT_IN_ID });

        expect(await isMicrophoneOnDevice(track, BUILT_IN_ID)).toBe(false);
    });
});
