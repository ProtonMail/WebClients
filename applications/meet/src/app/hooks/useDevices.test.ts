import { renderHook, waitFor } from '@testing-library/react';

import { useDevices } from './useDevices';

const mockDevices = [
    { kind: 'videoinput', deviceId: 'mock-id1' },
    { kind: 'videoinput', deviceId: 'mock-id2' },
    { kind: 'audioinput', deviceId: 'mock-id3' },
    { kind: 'audioinput', deviceId: 'mock-id4' },
];

describe('useDevices', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    beforeEach(() => {
        const originalNavigator = global.navigator;

        const mockNavigator = {
            ...originalNavigator,
            mediaDevices: {
                getUserMedia: vi.fn().mockReturnValue({
                    getAudioTracks: vi
                        .fn()
                        .mockReturnValue([{ getSettings: vi.fn().mockReturnValue({ deviceId: 'mock-id3' }) }]),
                    getVideoTracks: vi
                        .fn()
                        .mockReturnValue([{ getSettings: vi.fn().mockReturnValue({ deviceId: 'mock-id1' }) }]),
                    getTracks: vi.fn().mockReturnValue([]),
                }),
                enumerateDevices: vi.fn().mockReturnValue(mockDevices),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        vi.stubGlobal('navigator', mockNavigator);
    });

    it('should return the devices and set the default ones', async () => {
        const { result } = renderHook(() => useDevices());

        await waitFor(() => {
            expect(result.current.defaultCamera).toEqual(mockDevices[0]);
            expect(result.current.defaultMicrophone).toEqual(mockDevices[2]);
            expect(result.current.cameras).toEqual(mockDevices.slice(0, 2));
            expect(result.current.microphones).toEqual(mockDevices.slice(2, 4));
        });
    });
});
