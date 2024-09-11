import type { ShareMembershipPayload } from './member';

export interface CreateDriveShare {
    AddressID: string;
    RootLinkID: string;
    Name: string;
    ShareKey: string;
    SharePassphrase: string;
    SharePassphraseSignature: string;
    PassphraseKeyPacket: string;
    NameKeyPacket: string;
}
export interface CreateDrivePhotosShare {
    Share: {
        Name: string;
        AddressID: string;
        AddressKeyID: string;
        Key: string;
        Passphrase: string;
        PassphraseSignature: string;
    };
    Link: {
        NodeKey: string;
        NodePassphrase: string;
        NodePassphraseSignature: string;
        NodeHashKey: string;
        Name: string;
    };
}

export interface UserShareResult {
    Shares: ShareMetaShort[];
}

export interface ShareMetaShort {
    AddressID: string;
    ShareID: string;
    Type: number;
    LinkID: string;
    Locked: boolean;
    VolumeID: string;
    Creator: string;
    Flags: number;
    PossibleKeyPackets?: { KeyPacket: string }[];
    VolumeSoftDeleted: boolean;
    State: number;
    CreateTime: number;
}

export interface ShareMeta extends ShareMetaShort {
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
    RootLinkRecoveryPassphrase?: string;
    Memberships: ShareMembershipPayload[];
}

export enum ShareFlags {
    MainShare = 1,
}
