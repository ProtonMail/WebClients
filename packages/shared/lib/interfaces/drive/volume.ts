import { ShareURL } from './sharing';

export interface CreateDriveVolume {
    AddressID: string;
    AddressKeyID: string;
    VolumeName: string;
    ShareName: string;
    FolderName: string;
    SharePassphrase: string;
    ShareKey: string;
    FolderPassphrase: string;
    FolderKey: string;
    FolderHashKey: string;
}

export interface DriveVolume {
    ID: string;
    Share: {
        ID: string;
        LinkID: string;
    };
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
