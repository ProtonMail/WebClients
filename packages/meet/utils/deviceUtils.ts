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

/**
 * Remove devices that are not useful for meet.
 */
export const filterDevices = (devices: SerializableDeviceInfo[]): SerializableDeviceInfo[] => {
    return devices.filter(
        (d) =>
            !d.label?.toLocaleLowerCase()?.includes('zoom') &&
            d.deviceId !== DEFAULT_DEVICE_ID &&
            !d.label?.toLocaleLowerCase()?.startsWith('monitor of')
    );
};

export interface CheckmarkDeviceState {
    useSystemDefault: boolean;
    preferredAvailable: boolean;
    hasDefaultOption: boolean;
}

export const shouldShowDeviceCheckmark = (
    deviceId: string,
    activeDeviceId: string,
    deviceState: CheckmarkDeviceState
): boolean => {
    if (deviceId !== activeDeviceId || deviceState.useSystemDefault) {
        return false;
    }
    if (deviceState.preferredAvailable) {
        return true;
    }
    return !deviceState.hasDefaultOption;
};

export const shouldShowSystemDefaultCheckmark = (deviceState: CheckmarkDeviceState): boolean => {
    const userSelectedSystemDefault = deviceState.useSystemDefault;
    const preferredDeviceNoLongerAvailable = !deviceState.preferredAvailable;

    return userSelectedSystemDefault || preferredDeviceNoLongerAvailable;
};

export const isDefaultDevice = (deviceId: string | null): boolean => {
    return deviceId === DEFAULT_DEVICE_ID;
};

export const getDefaultDevice = (devices: SerializableDeviceInfo[]): SerializableDeviceInfo | null => {
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

    // There is no default device for videoinput, return null
    if (devices[0]?.kind === 'videoinput') {
        return null;
    }

    // Firefox (and other browsers without a synthetic "default" entry) return devices from
    // enumerateDevices() in system-preference order, so the first one is the actual OS default.
    return devices[0] ?? null;
};

export const resolveDevice = (
    deviceId: string,
    devices: SerializableDeviceInfo[],
    systemDefault: SerializableDeviceInfo
): SerializableDeviceInfo => {
    const userSelectedSystemDefault = isDefaultDevice(deviceId);

    if (userSelectedSystemDefault) {
        return systemDefault;
    }

    const matchingDevice = devices.find((d) => d.deviceId === deviceId);

    return matchingDevice ?? systemDefault;
};

/**
 * Get a hash of the devices based on deviceId and groupId.
 * Used to shallow compare device lists.
 */
export const getDevicesHash = (devices: (MediaDeviceInfo | SerializableDeviceInfo)[]) =>
    devices
        // We sort the devices by deviceId to ensure the hash is consistent
        // Brave browser randomize the devices to avoid fingerprinting
        .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
        .map((d) => `${d.deviceId}:${d.groupId}`)
        .join(',');
