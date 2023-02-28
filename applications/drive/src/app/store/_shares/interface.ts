import { SessionKey } from '@proton/crypto';

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
    lockedVolumeId: string;
    defaultShare: LockedShareForRestore;
    devices: LockedDeviceForRestore[];
}

export interface LockedShareForRestore {
    shareId: string;
    linkDecryptedPassphrase: string;
}

export interface LockedDeviceForRestore extends LockedShareForRestore {
    deviceName: string | undefined;
    shareDecryptedPassphrase: string;
    shareSessionKey: SessionKey;
}
