import type { SwitchActiveDevice, ToggleAudioType, ToggleVideoType } from '../../../types';
import { useActiveDeviceSync } from './useActiveDeviceSync';
import { useDeviceListSync } from './useDeviceListSync';
import { useDevicePermissionsSync } from './useDevicePermissionsSync';
import { useDynamicDeviceHandling } from './useDynamicDeviceHandling';

export const useDeviceManagement = ({
    toggleAudio,
    toggleVideo,
    switchActiveDevice,
}: {
    toggleAudio: ToggleAudioType;
    toggleVideo: ToggleVideoType;
    switchActiveDevice: SwitchActiveDevice;
}) => {
    // Sync device list from browser to redux
    useDeviceListSync();

    // Sync active device from livekit to redux
    useActiveDeviceSync();

    // Handle dynamic device (unplugging, plugging, etc.)
    useDynamicDeviceHandling({ toggleAudio, toggleVideo, switchActiveDevice });

    // Sync device permissions from browser to redux
    const { permissionsLoading } = useDevicePermissionsSync();

    return { permissionsLoading };
};
