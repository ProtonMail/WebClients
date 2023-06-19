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
    haveLegacyName: true,
};

const DEVICE_1: Device = {
    id: '2',
    volumeId: '1',
    shareId: SHARE_ID_1,
    linkId: 'linkId1',
    name: 'Macbook Pro',
    modificationTime: Date.now(),
    haveLegacyName: true,
};

const DEVICE_2: Device = {
    id: '3',
    volumeId: '1',
    shareId: SHARE_ID_1,
    linkId: 'linkId1',
    name: '',
    modificationTime: Date.now(),
    haveLegacyName: false,
};

const mockDevicesPayload = [DEVICE_0, DEVICE_1];

jest.mock('@proton/shared/lib/api/drive/devices', () => {
    return {
        fetchDevicesMock: async () => mockDevicesPayload,
    };
});

const mockedLoadDevices = jest.fn().mockResolvedValue(mockDevicesPayload);

jest.mock('./useDevicesApi', () => {
    const useDeviceApi = () => {
        return {
            loadDevices: mockedLoadDevices,
        };
    };

    return useDeviceApi;
});

const mockedGetLink = jest.fn();
jest.mock('../_links', () => {
    const useLink = jest.fn(() => ({
        getLink: mockedGetLink,
    }));
    return { useLink };
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
            await hook.current.loadDevices(new AbortController().signal);
            const device = hook.current.getDeviceByShareId(SHARE_ID_0);
            expect(device).toEqual(DEVICE_0);
        });
    });

    it('lists loaded devices', async () => {
        await act(async () => {
            await hook.current.loadDevices(new AbortController().signal);
            const cachedDevices = hook.current.cachedDevices;

            const targetList = [DEVICE_0, DEVICE_1];
            expect(cachedDevices).toEqual(targetList);
        });
    });

    it('getLink should be call to get root link', async () => {
        mockedLoadDevices.mockResolvedValue([DEVICE_2]);
        await act(async () => {
            const name = 'rootName';
            mockedGetLink.mockReturnValue({ name });
            await hook.current.loadDevices(new AbortController().signal);
            const cachedDevices = hook.current.cachedDevices;

            const targetList = [{ ...DEVICE_2, name }];
            expect(cachedDevices).toEqual(targetList);
            expect(mockedGetLink).toHaveBeenCalled();
        });
    });
});
