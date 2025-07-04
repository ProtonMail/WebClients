export const getDeviceLabel = (device: MediaDeviceInfo) => {
    if (!device) {
        return '';
    }

    return device.label.replace(/\s*\(.*?\)\s*/g, '').trim();
};
