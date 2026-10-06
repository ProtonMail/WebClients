import { describe, expect, it } from 'vitest';

import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

import { isSameHardware } from './isSameHardware';

const device = (kind: MediaDeviceKind, label: string, groupId = `${kind}-group`): SerializableDeviceInfo => ({
    deviceId: `${kind}-${label}`,
    groupId,
    kind,
    label,
});

describe('isSameHardware', () => {
    it('matches the kinds of one device through the groupId they share', () => {
        expect(
            isSameHardware(
                device('audioinput', 'Microphone (HD Pro Webcam C920)', 'webcam-group'),
                device('videoinput', 'HD Pro Webcam C920', 'webcam-group')
            )
        ).toBe(true);
    });

    it('does not take the default group for a device', () => {
        expect(
            isSameHardware(device('audioinput', 'Default', 'default'), device('audiooutput', 'Default', 'default'))
        ).toBe(false);
    });

    it.each([
        ['Microphone (HD Pro Webcam C920)', 'HD Pro Webcam C920'],
        ['Speakerphone (Brio 300)', 'Brio 300 (046d:0943)'],
        ['Mikrofon (Brio 300)', 'Brio 300'],
        ['Logitech StreamCam', 'Logitech StreamCam (046d:0893)'],
        ['Microphone (2- C270 HD WEBCAM)', 'C270 HD WEBCAM'],
    ])('finds the camera name in %s for %s when the groupIds differ', (microphoneLabel, cameraLabel) => {
        expect(isSameHardware(device('audioinput', microphoneLabel), device('videoinput', cameraLabel))).toBe(true);
        expect(isSameHardware(device('videoinput', cameraLabel), device('audioinput', microphoneLabel))).toBe(true);
    });

    it('pairs a camera with the speaker of the same webcam', () => {
        expect(
            isSameHardware(
                device('audiooutput', 'Speakers (HD Pro Webcam C920)'),
                device('videoinput', 'HD Pro Webcam C920')
            )
        ).toBe(true);
    });

    it.each([
        ['Microphone (Brio 3000)', 'Brio 300'],
        ['Microphone (HD Pro Webcam C920)', 'HD Pro Webcam C930'],
        ['Microphone (Cam Link)', 'Cam'],
        ['Microphone Array (Realtek(R) Audio)', 'Integrated Camera'],
    ])('does not find the camera name in %s for %s', (microphoneLabel, cameraLabel) => {
        expect(isSameHardware(device('audioinput', microphoneLabel), device('videoinput', cameraLabel))).toBe(false);
    });

    it('matches on the usb id chrome appends when the names disagree', () => {
        expect(
            isSameHardware(
                device('audioinput', 'Microphone (USB Audio Device) (0d8c:0014)'),
                device('audiooutput', 'Speakers (USB Audio Device) (0d8c:0014)')
            )
        ).toBe(true);
    });

    it('leaves the two audio kinds to the groupId and the usb id, never the name', () => {
        expect(
            isSameHardware(
                device('audioinput', 'Headset Microphone (Jabra Evolve2 30)'),
                device('audiooutput', 'Headset Earphone (Jabra Evolve2 30)')
            )
        ).toBe(false);
    });

    it('does not pair two cameras by name', () => {
        expect(
            isSameHardware(
                device('videoinput', 'HD Pro Webcam C920', 'one'),
                device('videoinput', 'HD Pro Webcam C920', 'other')
            )
        ).toBe(false);
    });
});
