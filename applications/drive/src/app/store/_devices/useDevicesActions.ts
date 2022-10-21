import { useApi, usePreventLeave } from '@proton/components';
import { queryDeviceDeletion, queryDeviceRename } from '@proton/shared/lib/api/drive/devices';

/**
 * useDevicesActions provides actions for manipulating with devices.
 */
export default function useDevicesActions() {
    const { preventLeave } = usePreventLeave();
    const api = useApi();

    const remove = async (deviceId: string, abortSignal?: AbortSignal) => {
        await preventLeave(
            api({
                ...queryDeviceDeletion(deviceId),
                signal: abortSignal,
            })
        );
        // TODO: events polling
    };

    const rename = async (params: { deviceId: string; newName: string }, abortSignal?: AbortSignal) => {
        await preventLeave(
            api({
                ...queryDeviceRename(params.deviceId, { Name: params.newName }),
                signal: abortSignal,
            })
        );
        // TODO: events polling
    };

    return {
        remove,
        rename,
    };
}
