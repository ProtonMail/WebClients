import { queryDevices } from '../../../api/devices';
import { deviceInfoToDevices, useDebouncedRequest } from '../_api';
import type { DevicesResult } from './devicePayload';
import type { DevicesState } from './interface';

export default function useDevicesApi() {
    const debouncedRequest = useDebouncedRequest();
    /* eslint-disable-next-line */
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
