import type { ShareURL } from './sharing';

export enum VolumeType {
    Regular = 1,
    Photos = 2,
}

export enum VolumeState {
    Active = 1,
    Locked = 3,
}

export enum VolumeRestoreStatus {
    Done = 0,
    Progress = 1,
    Failed = -1,
}

export interface CreateDriveVolume {
    AddressID: string;
    AddressKeyID: string;
    FolderName: string;
    SharePassphrase: string;
    ShareKey: string;
    FolderPassphrase: string;
    FolderKey: string;
    FolderHashKey: string;
}

interface DriveVolume {
    ID: string;
    VolumeID: string;
    CreateTime: number | null;
    ModifyTime: number | null;
    UsedSpace: number;
    DownloadedBytes: number;
    UploadedBytes: number;
    State: VolumeState;
    Share: {
        ShareID: string;
        ID: string;
        LinkID: string;
    };
    Type: VolumeType;
    RestoreStatus: VolumeRestoreStatus | null;
}

export interface UserDriveVolumesResult {
    Volumes: DriveVolume[];
}

export interface GetDriveVolumeResult {
    Volume: DriveVolume;
}

export interface CreatedDriveVolumeResult {
    Volume: DriveVolume;
}

export interface RestoreDriveVolume {
    SignatureAddress: string;
    MainShares?: {
        LockedShareID: string;
        Name: string;
        Hash: string;
        NodePassphrase: string;
        NodePassphraseSignature: string;
        NodeHashKey?: string;
    }[];
    Devices?: {
        LockedShareID: string;
        ShareKeyPacket: string;
        PassphraseSignature: string;
    }[];
    PhotoShares?: {
        LockedShareID: string;
        ShareKeyPacket: string;
        PassphraseSignature: string;
    }[];
    AddressKeyID: string;
}

export interface ListDriveVolumeTrashPayload {
    Trash: {
        LinkIDs: string[];
        ShareID: string;
        ParentIDs: string[];
    }[];
}

export interface ListDriveVolumeSharedLinksPayload {
    ShareURLContexts: {
        ContextShareID: string;
        ShareURLs: ShareURL[];
        LinkIDs: string[];
    }[];
}
