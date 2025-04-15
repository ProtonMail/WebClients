import type { ShareURL } from './sharing';

export enum VolumeType {
    Regular = 1,
    Photos = 2,
}

export enum VolumeRestoreStatus {
    Done = 0,
    Progress = 1,
    Failed = -1,
}

export interface UserVolumesResult {
    Volumes: DriveVolume[];
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

export interface DriveVolume {
    ID: string;
    VolumeID: string;
    CreateTime: number | null;
    ModifyTime: number | null;
    UsedSpace: number;
    DownloadedBytes: number;
    UploadedBytes: number;
    State: number;
    Share: {
        ShareID: string;
        ID: string;
        LinkID: string;
    };
    Type: VolumeType;
    RestoreStatus: VolumeRestoreStatus | null;
}

export interface GetDriveVolumeResult {
    Volume: DriveVolume;
}

export interface CreatedDriveVolumeResult {
    Volume: DriveVolume;
}

export interface RestoreDriveVolume {
    Name: string;
    SignatureAddress: string;
    Hash: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    TargetVolumeID: string;
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

export interface CreateDrivePhotosWithAlbumsVolume {
    Share: {
        AddressID: string;
        AddressKeyID: string;
        Key: string;
        Passphrase: string;
        PassphraseSignature: string;
    };
    Link: {
        Name: string;
        NodeKey: string;
        NodePassphrase: string;
        NodePassphraseSignature: string;
        NodeHashKey: string;
    };
}
