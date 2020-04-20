import { LinkType } from './link';

export interface UserShareResult {
    Shares: {
        ShareID: string;
        Type: number;
        Mask: number;
        LinkID: string;
        LinkType: LinkType;
        VolumeID: string;
        CreatorID: string;
        PermissionMask: 0;
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
    CreatorID: string;
    PermissionMask: 0;
    Flags: number;
    BlockSize: number;
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
}
