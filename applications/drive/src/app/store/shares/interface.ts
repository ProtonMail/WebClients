export interface Share {
    shareId: string;
    rootLinkId: string;
    volumeId: string;
    creator: string;
    isLocked: boolean;
    isDefault: boolean;
    isVolumeSoftDeleted: boolean;
    possibleKeyPackets: string[];
}

export interface ShareWithKey extends Share {
    key: string;
    passphrase: string;
    passphraseSignature: string;
    addressId: string;
    rootLinkRecoveryPassphrase?: string;
}

export interface LockedVolumeForRestore {
    lockedVolumeId: string;
    decryptedPassphrase: string;
}
