import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

export const shortId = (deviceId: string | null | undefined) => {
    if (deviceId === undefined) {
        return '(undefined)';
    }
    if (deviceId === null) {
        return '(null)';
    }
    if (deviceId === '') {
        return '(empty)';
    }
    if (deviceId === 'default') {
        return 'default';
    }
    return deviceId.slice(0, 8);
};

const labelFor = (devices: SerializableDeviceInfo[], deviceId: string | null | undefined) =>
    devices.find((device) => device.deviceId === deviceId)?.label ?? '(not in list)';

export const describe = (devices: SerializableDeviceInfo[], deviceId: string | null | undefined) =>
    `${shortId(deviceId)} · ${labelFor(devices, deviceId)}`;
