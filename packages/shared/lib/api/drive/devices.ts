import { CreateDeviceVolume, DevicesResult } from '../../interfaces/drive/device';

export const queryDevices = () => ({
    method: 'get',
    url: 'drive/devices',
});

export const fetchDevicesMock = async (): Promise<DevicesResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                Devices: [
                    {
                        Device: {
                            DeviceID: '1',
                            VolumeID: '1',
                            CreateTime: Date.now(),
                            ModifyTime: Date.now(),
                            Type: 1,
                            SyncState: 1,
                        },
                        Share: {
                            ShareID:
                                'iCh9uK5GOkusxvJk68rP81v7udtFxkvyhe_0Z6Fg7Ot37C3A5R5V_dt5OqBuIGnXrfX9ILrPkWNVB9gsPwNbtg==',
                            Name: 'HOME-DESKTOP',
                            LinkID: 'hqtFxkbSeO1bLlLzdn5_kkaSAV4aapKlQVsb5mdktrVtxFWEVg8nBvDLL08UbTDROsj5n5s6HlW5DSe_0N17fg==',
                        },
                    },
                ],
            });
        }, 5000);
    });
};

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
