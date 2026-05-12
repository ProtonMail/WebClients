import { getDeviceItemAriaLabel } from './deviceItemAriaLabel';
import type { StoreDevice } from './useDevices.store';

// The function only reads the `name` field, so a minimal cast is enough for tests.
const makeDevice = (name: string): StoreDevice => ({ name }) as StoreDevice;

describe('getDeviceItemAriaLabel', () => {
    it('falls back to "Device #<position>" (1-based) when device is undefined', () => {
        expect(getDeviceItemAriaLabel({ device: undefined, index: 0 })).toBe('Device #1');
        expect(getDeviceItemAriaLabel({ device: undefined, index: 4 })).toBe('Device #5');
    });

    it('falls back to "Device #<position>" when device has no name', () => {
        expect(getDeviceItemAriaLabel({ device: makeDevice(''), index: 0 })).toBe('Device #1');
    });

    it('formats as "Device: <name>"', () => {
        expect(getDeviceItemAriaLabel({ device: makeDevice('MacBook Pro'), index: 0 })).toBe('Device: MacBook Pro');
    });
});
