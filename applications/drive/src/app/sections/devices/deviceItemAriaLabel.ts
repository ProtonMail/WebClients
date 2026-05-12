import { c } from 'ttag';

import type { StoreDevice } from './useDevices.store';

interface GetDeviceItemAriaLabelParams {
    device: StoreDevice | undefined;
    index: number;
}

// Aria-label for the device row activator. Devices can't be selected, so the
// selection state is ignored. Output is "Device: <name>", or "Device #<n>" as
// a positional fallback when the device data is not yet available.
export const getDeviceItemAriaLabel = ({ device, index }: GetDeviceItemAriaLabelParams): string => {
    if (!device?.name) {
        const position = index + 1;
        return c('Label').t`Device #${position}`;
    }
    const name = device.name;
    return c('Label').t`Device: ${name}`;
};
