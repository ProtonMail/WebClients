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
        Name: string;
        LinkID: string;
    };
}

export type DevicesResult = {
    Devices: DevicePayload[];
};

export interface CreateDeviceVolume {
    Device: {
        VolumeID: string;
        SyncState: number;
        Type: number;
    };
    Share: {
        Name: string;
        AddressID: string;
        AddressKeyID: string;
        Key: string;
        Passphrase: string;
        PassphraseSignature: string;
    };
    Link: {
        NodeKey: string;
        NodePassphrase: string;
        NodePassphraseSignature: string;
        NodeHashKey: string;
        Name: string;
    };
}
