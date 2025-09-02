import type { Device } from '@proton/drive';
import isTruthy from '@proton/utils/isTruthy';

import type { StoreDevice } from './devices.store';

export const getDeviceName = (device: Device | StoreDevice): string => {
    if (typeof device.name === 'string') {
        return device.name;
    }
    if (device.name.ok) {
        return device.name.value;
    } else {
        if (isTruthy(device.name.error.name)) {
            return device.name.error.name;
        }
        return `�`;
    }
};
