import { getDrive } from '@proton/drive/index';

export const getDeviceByUid = async (uid: string, drive = getDrive()) => {
    for await (const device of drive.iterateDevices()) {
        if (device.uid === uid) {
            return device;
        }
    }
};
