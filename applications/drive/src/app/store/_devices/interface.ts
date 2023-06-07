export interface Device {
    id: string;
    volumeId: string;
    shareId: string;
    linkId: string;
    name: string;
    modificationTime: number;
    haveLegacyName: boolean;
}

export type DevicesState = {
    [deviceId: string]: Device;
};
