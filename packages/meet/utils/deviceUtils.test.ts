import { describe, expect, it } from 'vitest';

import {
    type CheckmarkDeviceState,
    getDeviceBehindCommunications,
    getSelectableDevices,
    shouldShowDeviceCheckmark,
    shouldShowSystemDefaultCheckmark,
} from './deviceUtils';

const state = (overrides: Partial<CheckmarkDeviceState> = {}): CheckmarkDeviceState => ({
    useSystemDefault: false,
    hasDefaultOption: true,
    ...overrides,
});

const device = (deviceId: string, kind: MediaDeviceKind, label: string, groupId = 'group'): MediaDeviceInfo => ({
    deviceId,
    groupId,
    kind,
    label,
    toJSON: () => ({ deviceId, groupId, kind, label }),
});

const getSelectableIds = (devices: MediaDeviceInfo[], kind: MediaDeviceKind) =>
    getSelectableDevices(devices, kind).map((selectable) => selectable.deviceId);

describe('getSelectableDevices', () => {
    it('drops the windows communications alias and keeps the default one', () => {
        const speakers = [
            device('default', 'audiooutput', 'Default - Speakers (8- Cirrus Logic XU)', 'b7442847'),
            device(
                'communications',
                'audiooutput',
                'Communications - Echo Cancelling Speakerphone (AVer VC520 Pro2) (2574:0a41)',
                'd3a0fb83'
            ),
            device('6ebba729', 'audiooutput', 'Echo Cancelling Speakerphone (AVer VC520 Pro2) (2574:0a41)', 'd3a0fb83'),
            device('484cac4a', 'audiooutput', 'Speakers (8- Cirrus Logic XU)', 'b7442847'),
        ];

        expect(getSelectableIds(speakers, 'audiooutput')).toEqual(['default', '6ebba729', '484cac4a']);
    });

    it('drops the loopback linux lists as a microphone for each output', () => {
        const microphones = [
            device('default', 'audioinput', 'Default'),
            device('monitor', 'audioinput', 'Monitor of Built-in Audio Analog Stereo'),
            device('builtin', 'audioinput', 'Built-in Audio Analog Stereo'),
        ];

        expect(getSelectableIds(microphones, 'audioinput')).toEqual(['default', 'builtin']);
    });

    it('drops the zoom virtual audio device', () => {
        const microphones = [
            device('default', 'audioinput', 'Default - MacBook Pro Microphone (Built-in)'),
            device('zoom', 'audioinput', 'ZoomAudioDevice'),
            device('zoom-spaced', 'audioinput', 'Zoom Audio Device'),
            device('zoom-virtual', 'audioinput', 'ZoomAudioDevice (Virtual)'),
            device('builtin', 'audioinput', 'MacBook Pro Microphone (Built-in)'),
        ];

        expect(getSelectableIds(microphones, 'audioinput')).toEqual(['default', 'builtin']);
    });

    it('keeps zoom corporation recorders and audio interfaces', () => {
        const microphones = [
            device('h6', 'audioinput', 'ZOOM H6'),
            device('uac-2', 'audioinput', 'ZOOM UAC-2'),
            device('podtrak', 'audioinput', 'Zoom PodTrak P4'),
            device('h4n', 'audioinput', 'H4n Pro'),
        ];

        expect(getSelectableIds(microphones, 'audioinput')).toEqual(['h6', 'uac-2', 'podtrak', 'h4n']);
    });

    it('drops the placeholders the browser lists before permission is granted', () => {
        const placeholders = [device('', 'audioinput', ''), device('', 'videoinput', '')];

        expect(getSelectableIds(placeholders, 'audioinput')).toEqual([]);
        expect(getSelectableIds(placeholders, 'videoinput')).toEqual([]);
    });

    it('keeps only the requested kind', () => {
        const devices = [
            device('mic', 'audioinput', 'MacBook Pro Microphone (Built-in)'),
            device('speaker', 'audiooutput', 'MacBook Pro Speakers (Built-in)'),
            device('camera', 'videoinput', 'FaceTime HD Camera'),
        ];

        expect(getSelectableIds(devices, 'videoinput')).toEqual(['camera']);
    });
});

describe('getDeviceBehindCommunications', () => {
    it('finds the windows output the communications alias points to', () => {
        const speakers = [
            device('default', 'audiooutput', 'Default - Headphones (Intel SST)', 'headphones-group'),
            device('communications', 'audiooutput', 'Communications - Headphones (Intel SST)', 'headphones-group'),
            device('headphones', 'audiooutput', 'Headphones (Intel SST)', 'headphones-group'),
            device('speakers', 'audiooutput', 'Speakers (Intel SST)', 'speakers-group'),
        ];

        expect(getDeviceBehindCommunications(speakers, 'audiooutput')?.deviceId).toBe('headphones');
    });

    it('follows the communications alias when windows points it away from the default output', () => {
        const speakers = [
            device('default', 'audiooutput', 'Default - Headphones (Intel SST)', 'headphones-group'),
            device('communications', 'audiooutput', 'Communications - Speakers (Intel SST)', 'speakers-group'),
            device('headphones', 'audiooutput', 'Headphones (Intel SST)', 'headphones-group'),
            device('speakers', 'audiooutput', 'Speakers (Intel SST)', 'speakers-group'),
        ];

        expect(getDeviceBehindCommunications(speakers, 'audiooutput')?.deviceId).toBe('speakers');
    });

    it('picks the system default output when the communications alias shares its group with another output', () => {
        const speakers = [
            device('default', 'audiooutput', 'Default - Speakers (Jabra Link 380)', 'jabra-group'),
            device(
                'communications',
                'audiooutput',
                'Communications - Headset Earphone (Jabra Link 380)',
                'jabra-group'
            ),
            device('headset-earphone', 'audiooutput', 'Headset Earphone (Jabra Link 380)', 'jabra-group'),
            device('jabra-speakers', 'audiooutput', 'Speakers (Jabra Link 380)', 'jabra-group'),
        ];

        expect(getDeviceBehindCommunications(speakers, 'audiooutput')?.deviceId).toBe('jabra-speakers');
    });

    it('picks the whole system default label over an output whose label is only its end', () => {
        const speakers = [
            device('default', 'audiooutput', 'Default - Headset Speakers (Poly)', 'poly-group'),
            device('communications', 'audiooutput', 'Communications - Speakers (Poly)', 'poly-group'),
            device('speakers', 'audiooutput', 'Speakers (Poly)', 'poly-group'),
            device('headset-speakers', 'audiooutput', 'Headset Speakers (Poly)', 'poly-group'),
        ];

        expect(getDeviceBehindCommunications(speakers, 'audiooutput')?.deviceId).toBe('headset-speakers');
    });

    it('falls back to the first output of the group when no label matches the system default', () => {
        const speakers = [
            device('default', 'audiooutput', 'Standard - Lautsprecher (Jabra Link 380)', 'jabra-group'),
            device('communications', 'audiooutput', 'Kommunikation - Headset (Jabra Link 380)', 'jabra-group'),
            device('headset', 'audiooutput', 'Headset (Jabra Link 380)', 'jabra-group'),
        ];

        expect(getDeviceBehindCommunications(speakers, 'audiooutput')?.deviceId).toBe('headset');
    });

    it('finds nothing where the browser lists no communications alias', () => {
        const speakers = [
            device('default', 'audiooutput', 'Default - MacBook Pro Speakers (Built-in)', 'built-in-group'),
            device('built-in', 'audiooutput', 'MacBook Pro Speakers (Built-in)', 'built-in-group'),
        ];

        expect(getDeviceBehindCommunications(speakers, 'audiooutput')).toBeUndefined();
    });
});

describe('device checkmarks', () => {
    it('marks the system default row when there is no saved preference', () => {
        const deviceState = state({ useSystemDefault: true });

        expect(shouldShowSystemDefaultCheckmark('mic-a', deviceState)).toBe(true);
        expect(shouldShowDeviceCheckmark('mic-a', 'mic-a', deviceState)).toBe(false);
    });

    it('marks the system default row when the synthetic default is what is in use', () => {
        const deviceState = state();

        expect(shouldShowSystemDefaultCheckmark('default', deviceState)).toBe(true);
        expect(shouldShowDeviceCheckmark('mic-a', 'default', deviceState)).toBe(false);
    });

    it('marks the device in use when the user picked it', () => {
        const deviceState = state();

        expect(shouldShowSystemDefaultCheckmark('mic-a', deviceState)).toBe(false);
        expect(shouldShowDeviceCheckmark('mic-a', 'mic-a', deviceState)).toBe(true);
        expect(shouldShowDeviceCheckmark('mic-b', 'mic-a', deviceState)).toBe(false);
    });

    it('marks the device in use when the saved preference is gone', () => {
        const deviceState = state();

        expect(shouldShowSystemDefaultCheckmark('mic-c', deviceState)).toBe(false);
        expect(shouldShowDeviceCheckmark('mic-c', 'mic-c', deviceState)).toBe(true);
    });

    it('marks the device in use when the browser exposes no system default row', () => {
        const deviceState = state({ useSystemDefault: true, hasDefaultOption: false });

        expect(shouldShowSystemDefaultCheckmark('mic-a', deviceState)).toBe(false);
        expect(shouldShowDeviceCheckmark('mic-a', 'mic-a', deviceState)).toBe(true);
    });

    it('marks nothing while no device is in use', () => {
        const deviceState = state();

        expect(shouldShowSystemDefaultCheckmark(null, deviceState)).toBe(false);
        expect(shouldShowDeviceCheckmark('mic-a', null, deviceState)).toBe(false);
    });
});
