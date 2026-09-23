export enum VolumeTypeForEvents {
    main = 'main',
    // shared = 'shared', // unused in the store, kept for reference: API volume type for shared volumes
    // photo = 'photo',   // unused in the store, kept for reference: API volume type for photo volumes
}

// Kept for reference: shape of a drive volume as returned by the API (decrypted form).
// export interface DriveVolume {
//     id: string;
//     volumeId: string;
//     createTime?: number;
//     modifyTime?: number;
//     usedSpace: number;
//     downloadedBytes: number;
//     uploadedBytes: number;
//     state: number;
//     share: {
//         shareId: string;
//         id: string;
//         linkId: string;
//     };
//     type: VolumeType;
//     restoreStatus?: VolumeRestoreStatus;
// }
