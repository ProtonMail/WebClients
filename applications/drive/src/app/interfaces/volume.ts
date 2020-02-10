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
    VolumeMaxSpace: 1000000;
}

export interface CreatedDriveVolumeResult {
    Volume: {
        ID: string;
        Share: {
            ID: string;
            LinkID: string;
        };
    };
}
