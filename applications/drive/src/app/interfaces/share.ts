import { LinkType } from './link';

export interface CreateDriveShare {
    AddressID: string;
    RootLinkID: string;
    Name: string;
    Type: number; // TODO: UNUSED - remove it when BE removes it
    LinkType: LinkType;
    PermissionsMask: number;
    ShareKey: string;
    SharePassphrase: string;
    SharePassphraseSignature: string;
    PassphraseKeyPacket: string;
    NameKeyPacket: string;
}

export interface UserShareResult {
    Shares: ShareMetaShort[];
}

export interface ShareMetaShort {
    ShareID: string;
    Type: number;
    LinkID: string;
    LinkType: LinkType;
    Locked: boolean;
    VolumeID: string;
    Creator: string;
    PermissionsMask: 0;
    Flags: number;
    BlockSize: number;
    PossibleKeyPackets?: { KeyPacket: string }[];
}

export interface ShareMeta extends ShareMetaShort {
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
    RootLinkRecoveryPassphrase?: string;
}

export enum ShareFlags {
    PrimaryShare = 1,
}
