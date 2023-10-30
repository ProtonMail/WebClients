import { SessionKey } from '@proton/crypto';

type WithSRPPayload<T extends any> = T & {
    srpModulusID: string;
    srpVerifier: string;
    urlPasswordSalt: string;
};
export enum ShareType {
    default = 1,
    standard,
    device,
    photos,
}

export enum ShareState {
    active = 1,
    deleted,
    restored,
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
    state: ShareState;
}

export interface ShareWithKey extends Share {
    key: string;
    passphrase: string;
    passphraseSignature: string;
    addressId: string;
    rootLinkRecoveryPassphrase?: string;
}

export type ShareURL = WithSRPPayload<{
    shareId: string;
    shareUrlId: string;
    expirationTime: number | null;
    creatorEmail: string;
    password: string;
    flags: number;
    token: string;
    publicUrl: string;
    sharePassphraseKeyPacket: string;
    sharePasswordSalt: string;
    hasCustomPassword: boolean;
    hasGeneratedPasswordIncluded: boolean;
    numAccesses: number;
    maxAccesses: number;
    permissions: number;
}>;

export type UpdateSharedURL = WithSRPPayload<{
    expirationDuration: number | null;
    expirationTime: number | null;
    flags: number;
    maxAccesses: number;
    password: string;
    permissions: number;
    sharePassphraseKeyPacket: string;
    sharePasswordSalt: string;
}>;

export interface LockedVolumeForRestore {
    lockedVolumeId: string;
    defaultShare: LockedShareForRestore;
    devices: LockedDeviceForRestore[];
    photos: LockedDeviceForRestore[];
}

export interface LockedShareForRestore {
    shareId: string;
    linkDecryptedPassphrase: string;
}

export interface LockedDeviceForRestore extends LockedShareForRestore {
    shareDecryptedPassphrase: string;
    shareSessionKey: SessionKey;
}
export interface LockedPhotosForRestore extends LockedShareForRestore {
    shareDecryptedPassphrase: string;
    shareSessionKey: SessionKey;
}
