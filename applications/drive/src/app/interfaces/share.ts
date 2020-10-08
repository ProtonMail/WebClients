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
    Shares: {
        ShareID: string;
        Type: number;
        LinkID: string;
        LinkType: LinkType;
        VolumeID: string;
        Creator: string;
        PermissionsMask: 0;
        Flags: number;
        BlockSize: number;
    }[];
}

export interface ShareMetaShort {
    ShareID: string;
    Type: number;
    LinkID: string;
    LinkType: LinkType;
    VolumeID: string;
    Creator: string;
    PermissionsMask: 0;
    Flags: number;
    BlockSize: number;
}

export interface ShareMeta extends ShareMetaShort {
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
}

export enum ShareFlags {
    PrimaryShare = 1,
}
