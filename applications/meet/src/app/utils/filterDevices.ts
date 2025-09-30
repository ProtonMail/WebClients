import { DEFAULT_DEVICE_ID } from '../constants';

export const filterDevices = (devices: MediaDeviceInfo[]) => {
    return devices
        .filter(
            (d) =>
                !d.label?.toLocaleLowerCase()?.includes('zoom') &&
                d.deviceId !== DEFAULT_DEVICE_ID &&
                !d.label?.toLocaleLowerCase()?.startsWith('monitor of')
        )
        .sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
};
