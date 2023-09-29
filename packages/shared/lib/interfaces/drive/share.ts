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

export interface UserShareResult {
    Shares: ShareMetaShort[];
}

export interface ShareMetaShort {
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
}

export interface ShareMeta extends ShareMetaShort {
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    AddressID: string;
    RootLinkRecoveryPassphrase?: string;
}

export enum ShareFlags {
    MainShare = 1,
}
