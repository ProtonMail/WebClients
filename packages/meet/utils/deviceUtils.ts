import { DEFAULT_DEVICE_ID } from '../constants';

export interface SerializableDeviceInfo {
    deviceId: string;
    groupId: string;
    kind: MediaDeviceKind;
    label: string;
}

export const toSerializableDevice = (device: MediaDeviceInfo): SerializableDeviceInfo => ({
    deviceId: device.deviceId,
    groupId: device.groupId,
    kind: device.kind,
    label: device.label,
});

export const filterDevices = <T extends SerializableDeviceInfo>(devices: T[]): T[] => {
    return devices
        .filter(
            (d) =>
                !d.label?.toLocaleLowerCase()?.includes('zoom') &&
                (!d.label?.toLocaleLowerCase()?.includes('virtual') || d.label?.toLocaleLowerCase()?.includes('obs')) &&
                d.deviceId !== DEFAULT_DEVICE_ID &&
                !d.label?.toLocaleLowerCase()?.startsWith('monitor of')
        )
        .sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
};

export interface CheckmarkDeviceState {
    useSystemDefault: boolean;
    preferredAvailable: boolean;
}

export const shouldShowDeviceCheckmark = (
    deviceId: string,
    activeDeviceId: string,
    deviceState: CheckmarkDeviceState
): boolean => {
    const isCurrentlyActiveDevice = deviceId === activeDeviceId;
    const isUsingSpecificDevice = !deviceState.useSystemDefault;
    const isPreferredDeviceAvailable = deviceState.preferredAvailable;

    return isCurrentlyActiveDevice && isUsingSpecificDevice && isPreferredDeviceAvailable;
};

export const shouldShowSystemDefaultCheckmark = (deviceState: CheckmarkDeviceState): boolean => {
    const userSelectedSystemDefault = deviceState.useSystemDefault;
    const preferredDeviceNoLongerAvailable = !deviceState.preferredAvailable;

    return userSelectedSystemDefault || preferredDeviceNoLongerAvailable;
};

export const isDefaultDevice = (deviceId: string | null): boolean => {
    return deviceId === DEFAULT_DEVICE_ID;
};

export const getDefaultDevice = <T extends SerializableDeviceInfo>(devices: T[]): T | null => {
    const defaultDevice = devices.find((d) => isDefaultDevice(d.deviceId));
    if (defaultDevice) {
        const duplicated = devices.find((d) => d.groupId === defaultDevice.groupId && !isDefaultDevice(d.deviceId));
        // When both deviceId and groupId are 'default', the browser can't associate this entry with any real device.
        // Return null so callers skip setSinkId entirely and audio routes natively via the browser's default output.
        if (!duplicated && isDefaultDevice(defaultDevice.groupId)) {
            return null;
        }
        return duplicated ?? filterDevices(devices)[0] ?? devices[0] ?? null;
    }
    // Firefox (and other browsers without a synthetic "default" entry) return devices
    // from enumerateDevices() in system-preference order, so the first one is the actual
    // OS default. Preserve that order here instead of using filterDevices, which sorts
    // alphabetically and would make the "Default - <label>" UI show the wrong device.
    return devices[0] ?? null;
};

export const resolveDevice = <T extends SerializableDeviceInfo>(
    deviceId: string,
    devices: T[],
    systemDefault: T
): T => {
    const userSelectedSystemDefault = isDefaultDevice(deviceId);

    if (userSelectedSystemDefault) {
        return systemDefault;
    }

    const matchingDevice = devices.find((d) => d.deviceId === deviceId);

    return matchingDevice ?? systemDefault;
};
