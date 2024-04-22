import { PublicKeyReference, SessionKey } from '@proton/crypto';
import { SHARE_MEMBER_PERMISSIONS, SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants';

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
    addressId: string;
    key: string;
    passphrase: string;
    passphraseSignature: string;
    rootLinkRecoveryPassphrase?: string;
    memberships: ShareMember[];
}

export type ShareURLLEGACY = WithSRPPayload<{
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

export interface ShareMemberLEGACY {
    memberId: string;
    shareId: string;
    addressId: string;
    addressKeyId: string;
    inviter: string;
    createTime: number;
    modifyTime: number;
    permissions: number;
    keyPacket: string;
    keyPacketSignature: string | null;
    sessionKeySignature: string | null;
    state: SHARE_MEMBER_STATE;
    unlockable: boolean | null;
}

export interface ShareMember {
    memberId: string;
    email: string;
    inviterEmail: string;
    addressId: string;
    createTime: number;
    modifyTime: number;
    permissions: SHARE_MEMBER_PERMISSIONS;
    keyPacketSignature: string;
    sessionKeySignature: string;
}

export interface ShareInvitation {
    invitationId: string;
    inviterEmail: string;
    inviteeEmail: string;
    permissions: SHARE_MEMBER_PERMISSIONS;
    keyPacket: string;
    keyPacketSignature: string;
    createTime: number;
    state: SHARE_MEMBER_STATE;
}

export interface ShareInvitee {
    name: string;
    email: string;
    contactId?: string;
    error?: Error;
    group?: string;
    isExternal?: boolean;
    isLoading?: boolean;
    publicKey?: PublicKeyReference;
}
