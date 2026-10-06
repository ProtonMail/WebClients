import { describe, expect, it } from 'vitest';

import { type CheckmarkDeviceState, shouldShowDeviceCheckmark, shouldShowSystemDefaultCheckmark } from './deviceUtils';

const state = (overrides: Partial<CheckmarkDeviceState> = {}): CheckmarkDeviceState => ({
    useSystemDefault: false,
    hasDefaultOption: true,
    ...overrides,
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
