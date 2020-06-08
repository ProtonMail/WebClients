import { LinkType } from './link';

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

export interface ShareMeta {
    ShareID: string;
    Type: number;
    VolumeID: string;
    LinkID: string;
    LinkType: LinkType;
    Creator: string;
    PermissionsMask: 0;
    Flags: number;
    BlockSize: number;
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
}
