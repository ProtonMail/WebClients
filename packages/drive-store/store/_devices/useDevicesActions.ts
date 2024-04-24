import { useApi, usePreventLeave } from '@proton/components';
import { queryDeviceDeletion, queryDeviceRename } from '@proton/shared/lib/api/drive/devices';

import useDevicesListing from './useDevicesListing';

/**
 * useDevicesActions provides actions for manipulating with devices.
 */
export default function useDevicesActions() {
    const { preventLeave } = usePreventLeave();
    const { renameCachedDevice, removeCachedDevice } = useDevicesListing();
    const api = useApi();

    const remove = async (deviceId: string, abortSignal?: AbortSignal) => {
        await preventLeave(
            api({
                ...queryDeviceDeletion(deviceId),
                signal: abortSignal,
            }).then(() => {
                removeCachedDevice(deviceId);
            })
        );
    };

    const rename = async (
        params: { deviceId: string; newName: string; haveLegacyName: boolean },
        abortSignal?: AbortSignal
    ) => {
        if (params.haveLegacyName) {
            await preventLeave(
                api({
                    ...queryDeviceRename(params.deviceId, { Name: '' }),
                    signal: abortSignal,
                }).then(() => {
                    renameCachedDevice(params.deviceId, params.newName);
                })
            );
        }
    };

    return {
        remove,
        rename,
    };
}
