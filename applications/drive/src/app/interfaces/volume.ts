export interface CreateDriveVolume {
    AddressID: string;
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

export enum InitStatusCodes {
    NoAccess = 2011,
}
