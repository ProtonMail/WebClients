import { c } from 'ttag';

import { DEFAULT_DEVICE_ID } from '../constants';
import type { DeviceState } from '../types';

export const filterDevices = (devices: MediaDeviceInfo[]) => {
    return devices
        .filter(
            (d) =>
                !d.label?.toLocaleLowerCase()?.includes('zoom') &&
                !d.label?.toLocaleLowerCase()?.includes('virtual') &&
                d.deviceId !== DEFAULT_DEVICE_ID &&
                !d.label?.toLocaleLowerCase()?.startsWith('monitor of')
        )
        .sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
};

export const getDefaultLabel = (systemDefault: MediaDeviceInfo | null) => {
    return systemDefault ? c('Info').t`Default - ${systemDefault.label}` : c('Info').t`Default`;
};

export const shouldShowDeviceCheckmark = (
    deviceId: string,
    activeDeviceId: string,
    deviceState: DeviceState
): boolean => {
    const isCurrentlyActiveDevice = deviceId === activeDeviceId;
    const isUsingSpecificDevice = !deviceState.useSystemDefault;
    const isPreferredDeviceAvailable = deviceState.preferredAvailable;

    return isCurrentlyActiveDevice && isUsingSpecificDevice && isPreferredDeviceAvailable;
};

export const shouldShowSystemDefaultCheckmark = (deviceState: DeviceState): boolean => {
    const userSelectedSystemDefault = deviceState.useSystemDefault;
    const preferredDeviceNoLongerAvailable = !deviceState.preferredAvailable;

    return userSelectedSystemDefault || preferredDeviceNoLongerAvailable;
};

export const isDefaultDevice = (deviceId: string | null): boolean => {
    return deviceId === DEFAULT_DEVICE_ID;
};

export const resolveDevice = (
    deviceId: string,
    devices: MediaDeviceInfo[],
    systemDefault: MediaDeviceInfo
): MediaDeviceInfo => {
    const userSelectedSystemDefault = isDefaultDevice(deviceId);

    if (userSelectedSystemDefault) {
        return systemDefault;
    }

    const matchingDevice = devices.find((d) => d.deviceId === deviceId);

    return matchingDevice ?? systemDefault;
};
