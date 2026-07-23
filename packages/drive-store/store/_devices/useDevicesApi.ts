import { queryDevices } from '@proton/shared/lib/api/drive/devices';
import type { DevicesResult } from '@proton/shared/lib/interfaces/drive/device';

import { deviceInfoToDevices } from '../_api/transformers';
import useDebouncedRequest from '../_api/useDebouncedRequest';
import type { DevicesState } from './interface';

export default function useDevicesApi() {
    const debouncedRequest = useDebouncedRequest();

    const loadDevices = async (abortSignal?: AbortSignal): Promise<DevicesState> => {
        const res = await debouncedRequest<DevicesResult>({
            ...queryDevices(),
            signal: abortSignal,
        });

        const responseDevices = res ? res.Devices : [];
        const devices = responseDevices.map(deviceInfoToDevices).reduce((acc, device) => {
            const { id } = device;
            acc[id] = device;
            return acc;
        }, {} as DevicesState);

        return devices;
    };

    return {
        loadDevices,
    };
}
