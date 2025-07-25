import type { PublicKeyReference, SessionKey } from '@proton/crypto';
import type { SHARE_EXTERNAL_INVITATION_STATE, SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants';
import type { SHARE_MEMBER_PERMISSIONS, SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import type { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import type { ThumbnailURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import type { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

type WithSRPPayload<T extends any> = T & {
    srpModulusID: string;
    srpVerifier: string;
    urlPasswordSalt: string;
};

// Share type string used in metrics context, do not confuse with ShareType enum.
export type ShareTypeString = 'main' | 'device' | 'photo' | 'shared';
export type ShareTypeStringWithPublic = ShareTypeString | 'shared_public';

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
    migrating,
    migrated,
    locked,
}

export interface Share {
    shareId: string;
    rootLinkId: string;
    volumeId: string;
    creator: string;
    isLocked: boolean;
    isDefault: boolean;
    possibleKeyPackets: string[];
    type: ShareType;
    linkType: LinkType;
    state: ShareState;
    createTime: number;
    volumeType?: VolumeType;
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
    defaultShares: LockedShareForRestore[];
    devices: LockedDeviceForRestore[];
    photos: LockedPhotosForRestore[];
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

interface ShareInvitationShare {
    shareId: string;
    volumeId: string;
    passphrase: string;
    shareKey: string;
    creatorEmail: string;
}

interface ShareInvitationLink {
    linkId: string;
    name: string;
    mimeType: string;
    isFile: boolean;
    type: LinkType;
}

export interface ShareInvitationDetails {
    invitation: ShareInvitation;
    share: ShareInvitationShare;
    link: ShareInvitationLink;
    decryptedLinkName?: string;
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

export interface SharedUrlInfo {
    contentKeyPacket: string;
    linkId: string;
    linkType: LinkType;
    mimeType: string;
    name: string;
    nodeKey: string;
    nodeHashKey: string | null;
    nodePassphrase: string;
    nodePassphraseSignature: string;
    permissions: SHARE_URL_PERMISSIONS;
    shareKey: string;
    sharePassphrase: string;
    sharePasswordSalt: string;
    size: number;
    signatureEmail?: string;
    thumbnailUrlInfo: ThumbnailURLInfo;
    token: string;
}
