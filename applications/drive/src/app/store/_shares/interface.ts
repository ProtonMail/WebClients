import type { PublicKeyReference, SessionKey } from '@proton/crypto';
import type {
    SHARE_EXTERNAL_INVITATION_STATE,
    SHARE_MEMBER_PERMISSIONS,
    SHARE_MEMBER_STATE,
} from '@proton/shared/lib/drive/constants';

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

export enum VolumeType {
    own = 'own',
    shared = 'shared',
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
    memberships: ShareMembership[];
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

export interface ShareMembership {
    memberId: string;
    shareId: string;
    addressId: string;
    addressKeyId: string;
    inviterEmail: string;
    createTime: number;
    modifyTime: number;
    permissions: SHARE_MEMBER_PERMISSIONS;
    state: SHARE_MEMBER_STATE;
    keyPacket: string;
    keyPacketSignature: string;
    sessionKeySignature: string;
    unlockable: boolean;
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

export interface ShareInvitationEmailDetails {
    message?: string;
    itemName?: string;
}

export interface ShareInvitationShare {
    shareId: string;
    volumeId: string;
    passphrase: string;
    shareKey: string;
    creatorEmail: string;
}

export interface ShareInvitationLink {
    linkId: string;
    name: string;
    mimeType: string;
    isFile: boolean;
}

export interface ShareInvitationDetails {
    invitation: ShareInvitation;
    share: ShareInvitationShare;
    link: ShareInvitationLink;
}

export interface ShareExternalInvitation {
    externalInvitationId: string;
    inviterEmail: string;
    inviteeEmail: string;
    createTime: number;
    permissions: SHARE_MEMBER_PERMISSIONS;
    state: SHARE_EXTERNAL_INVITATION_STATE;
    externalInvitationSignature: string;
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
