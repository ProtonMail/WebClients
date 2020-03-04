export interface UserShareResult {
    Shares: {
        ShareID: string;
        Type: number;
        Mask: number;
        LinkID: string;
        VolumeID: string;
        CreatorID: string;
        Flags: number;
    }[];
}

export interface ShareMeta {
    ShareID: string;
    Type: number;
    VolumeID: string;
    LinkID: string;
    CreatorID: string;
    PermissionMask: 0;
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
}
