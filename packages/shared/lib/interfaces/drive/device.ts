export interface DevicePayload {
    Device: {
        DeviceID: string;
        VolumeID: string;
        CreateTime: number;
        ModifyTime: number;
        Type: number;
        SyncState: number;
    };
    Share: {
        ShareID: string;
        Name: string; // TODO: deprecated and should be removed
        LinkID: string;
    };
}

export type DevicesResult = {
    Devices: DevicePayload[];
};
