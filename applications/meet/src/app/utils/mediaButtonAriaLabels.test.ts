import { getCameraButtonAriaLabel, getMicrophoneButtonAriaLabel } from './mediaButtonAriaLabels';

const ready = { hasPermission: true, noDeviceDetected: false, isEnabled: true };

describe('mediaButtonAriaLabels', () => {
    it('names a loading toggle by its loading state', () => {
        expect(getMicrophoneButtonAriaLabel({ ...ready, isLoading: true })).toBe('Microphone is starting');
        expect(getCameraButtonAriaLabel({ ...ready, isLoading: true })).toBe('Camera is starting');
    });

    it('names a ready toggle by its action', () => {
        expect(getMicrophoneButtonAriaLabel(ready)).toBe('Mute microphone');
        expect(getCameraButtonAriaLabel({ ...ready, isEnabled: false })).toBe('Turn on camera');
    });
});
