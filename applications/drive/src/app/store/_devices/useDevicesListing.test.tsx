import { act, renderHook } from '@testing-library/react-hooks';

import { VolumesStateProvider } from '../_volumes/useVolumesState';
import { Device } from './interface';
import { useDevicesListingProvider } from './useDevicesListing';

const SHARE_ID_0 = 'shareId0';
const SHARE_ID_1 = 'shareId1';
const DEVICE_0: Device = {
    id: '1',
    volumeId: '1',
    shareId: SHARE_ID_0,
    linkId: 'linkId0',
    name: 'HOME-DESKTOP',
    modificationTime: Date.now(),
};

const DEVICE_1: Device = {
    id: '2',
    volumeId: '1',
    shareId: SHARE_ID_1,
    linkId: 'linkId1',
    name: 'Macbook Pro',
    modificationTime: Date.now(),
};

const mockDevicesPayload = [DEVICE_0, DEVICE_1];

jest.mock('@proton/shared/lib/api/drive/devices', () => {
    return {
        fetchDevicesMock: async () => mockDevicesPayload,
    };
});

jest.mock('./useDevicesApi', () => {
    const useDeviceApi = () => {
        return {
            loadDevices: async () => mockDevicesPayload,
        };
    };

    return useDeviceApi;
});

describe('useLinksState', () => {
    let hook: {
        current: ReturnType<typeof useDevicesListingProvider>;
    };

    beforeEach(() => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>{children}</VolumesStateProvider>
        );

        const { result } = renderHook(() => useDevicesListingProvider(), { wrapper });
        hook = result;
    });

    it('finds device by shareId', async () => {
        await act(async () => {
            await hook.current.loadDevices();
            const device = hook.current.getDeviceByShareId(SHARE_ID_0);
            expect(device).toEqual(DEVICE_0);
        });
    });

    it('lists loaded devices', async () => {
        await act(async () => {
            await hook.current.loadDevices();
            const cachedDevices = hook.current.cachedDevices;

            const targetList = [DEVICE_0, DEVICE_1];
            expect(cachedDevices).toEqual(targetList);
        });
    });
});
