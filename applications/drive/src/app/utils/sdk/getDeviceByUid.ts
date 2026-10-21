import { getDrive } from '@proton/drive/sdk';

export const getDeviceByUid = async (uid: string, drive = getDrive()) => {
    for await (const device of drive.iterateDevices()) {
        if (device.uid === uid) {
            return device;
        }
    }
};
