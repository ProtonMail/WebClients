import { describe, expect, it } from 'vitest';

import type { SerializableDeviceInfo } from '../../../utils/deviceUtils';
import type { MeetState } from '../../rootReducer';
import { selectSelectedAudioOutputId, selectSelectedCameraId, selectSelectedMicrophoneId } from './selectors';

const device = (deviceId: string, label = deviceId, kind: MediaDeviceKind = 'audiooutput'): SerializableDeviceInfo => ({
    deviceId,
    groupId: `group-${deviceId}`,
    kind,
    label,
});

const createMockState = (
    overrides: {
        cameras?: SerializableDeviceInfo[];
        microphones?: SerializableDeviceInfo[];
        speakers?: SerializableDeviceInfo[];
        preferredCameraId?: string | null;
        preferredMicrophoneId?: string | null;
        preferredSpeakerId?: string | null;
        activeCameraId?: string;
        activeMicrophoneId?: string;
        activeAudioOutputId?: string;
    } = {}
): MeetState =>
    ({
        deviceManagement: {
            cameras: overrides.cameras ?? [],
            microphones: overrides.microphones ?? [],
            speakers: overrides.speakers ?? [],
            preferredCameraId: overrides.preferredCameraId ?? null,
            preferredMicrophoneId: overrides.preferredMicrophoneId ?? null,
            preferredSpeakerId: overrides.preferredSpeakerId ?? null,
            activeCameraId: overrides.activeCameraId ?? '',
            activeMicrophoneId: overrides.activeMicrophoneId ?? '',
            activeAudioOutputId: overrides.activeAudioOutputId ?? '',
        },
    }) as unknown as MeetState;

// These three selectors answer "what should the picker show a checkmark on", and the answer is what
// is in use right now. The preference only wins while nothing is in use, because a preferred device
// can be plugged in and waiting for the user to act on the notification while another one plays.
describe('deviceManagementSlice selectors', () => {
    describe('selectSelectedAudioOutputId', () => {
        it('returns the active device when it is available', () => {
            const state = createMockState({
                speakers: [device('jabra'), device('builtin')],
                activeAudioOutputId: 'builtin',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('builtin');
        });

        it('prefers the active device over an available preference', () => {
            const state = createMockState({
                speakers: [device('jabra'), device('builtin')],
                preferredSpeakerId: 'jabra',
                activeAudioOutputId: 'builtin',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('builtin');
        });

        it('falls back to the preference while nothing is in use yet', () => {
            const state = createMockState({
                speakers: [device('jabra'), device('builtin')],
                preferredSpeakerId: 'jabra',
                activeAudioOutputId: '',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('jabra');
        });

        it('falls back to the preference when the active device is gone', () => {
            const state = createMockState({
                speakers: [device('jabra'), device('builtin')],
                preferredSpeakerId: 'jabra',
                activeAudioOutputId: 'unplugged-dock',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('jabra');
        });

        it('returns the active device when neither it nor the preference are available', () => {
            const state = createMockState({
                speakers: [device('builtin')],
                preferredSpeakerId: 'unplugged-jabra',
                activeAudioOutputId: 'unplugged-dock',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('unplugged-dock');
        });

        it('ignores a preference that is not plugged in', () => {
            const state = createMockState({
                speakers: [device('builtin')],
                preferredSpeakerId: 'unplugged-jabra',
                activeAudioOutputId: 'builtin',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('builtin');
        });

        it('resolves against the unfiltered list, so the synthetic default entry counts as available', () => {
            const state = createMockState({
                speakers: [device('default', 'Default'), device('builtin')],
                activeAudioOutputId: 'default',
            });

            expect(selectSelectedAudioOutputId(state)).toBe('default');
        });
    });

    describe('selectSelectedMicrophoneId', () => {
        it('prefers the active device over an available preference', () => {
            const state = createMockState({
                microphones: [device('usb-mic', 'USB Microphone', 'audioinput'), device('builtin-mic')],
                preferredMicrophoneId: 'usb-mic',
                activeMicrophoneId: 'builtin-mic',
            });

            expect(selectSelectedMicrophoneId(state)).toBe('builtin-mic');
        });

        it('falls back to the preference when the active device is gone', () => {
            const state = createMockState({
                microphones: [device('usb-mic', 'USB Microphone', 'audioinput')],
                preferredMicrophoneId: 'usb-mic',
                activeMicrophoneId: 'unplugged-mic',
            });

            expect(selectSelectedMicrophoneId(state)).toBe('usb-mic');
        });
    });

    describe('selectSelectedCameraId', () => {
        it('prefers the active device over an available preference', () => {
            const state = createMockState({
                cameras: [device('brio', 'Brio', 'videoinput'), device('facetime', 'FaceTime HD', 'videoinput')],
                preferredCameraId: 'brio',
                activeCameraId: 'facetime',
            });

            expect(selectSelectedCameraId(state)).toBe('facetime');
        });

        it('falls back to the preference when the active device is gone', () => {
            const state = createMockState({
                cameras: [device('brio', 'Brio', 'videoinput')],
                preferredCameraId: 'brio',
                activeCameraId: 'unplugged-cam',
            });

            expect(selectSelectedCameraId(state)).toBe('brio');
        });

        it('returns an empty id while the list is still empty', () => {
            const state = createMockState({ cameras: [], preferredCameraId: 'brio', activeCameraId: '' });

            expect(selectSelectedCameraId(state)).toBe('');
        });
    });
});
