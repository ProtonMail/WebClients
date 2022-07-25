export enum ShareType {
    default = 1,
    standart,
    device,
}

export interface Share {
    shareId: string;
    rootLinkId: string;
    volumeId: string;
    creator: string;
    isLocked: boolean;
    isDefault: boolean;
    isVolumeSoftDeleted: boolean;
    possibleKeyPackets: string[];
    type: ShareType;
}

export interface ShareWithKey extends Share {
    key: string;
    passphrase: string;
    passphraseSignature: string;
    addressId: string;
    rootLinkRecoveryPassphrase?: string;
}

export interface LockedVolumeForRestore {
    shareId: string;
    lockedVolumeId: string;
    decryptedPassphrase: string;
}
