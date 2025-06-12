import type { VolumeRestoreStatus, VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

export enum VolumeTypeForEvents {
    main = 'main',
    shared = 'shared',
    photo = 'photo',
}

export interface DriveVolume {
    id: string;
    volumeId: string;
    createTime?: number;
    modifyTime?: number;
    usedSpace: number;
    downloadedBytes: number;
    uploadedBytes: number;
    state: number;
    share: {
        shareId: string;
        id: string;
        linkId: string;
    };
    type: VolumeType;
    restoreStatus?: VolumeRestoreStatus;
}
