import { CreateDeviceVolume } from '../../interfaces/drive/device';

export const queryDevices = () => ({
    method: 'get',
    url: 'drive/devices',
});

export const queryDeviceDeletion = (deviceId: string) => ({
    method: 'delete',
    url: `drive/devices/${deviceId}`,
});

export const queryDeviceRename = (
    deviceId: string,
    data: {
        Name: string;
    }
) => ({
    method: 'put',
    url: `drive/devices/${deviceId}`,
    data: {
        Device: {
            SyncState: 1,
        },
        Share: {
            Name: data.Name,
        },
    },
});

export const queryCreateDriveDevice = (data: CreateDeviceVolume) => ({
    method: 'post',
    url: 'drive/devices',
    data,
});
