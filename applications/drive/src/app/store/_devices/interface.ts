export interface Device {
    id: string;
    volumeId: string;
    shareId: string;
    linkId: string;
    name: string;
    modificationTime: number;
}

export type DevicesState = {
    [deviceId: string]: Device;
};
