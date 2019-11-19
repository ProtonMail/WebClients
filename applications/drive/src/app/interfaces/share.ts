export interface UserSharesResult {
    Shares: UserShare[];
}

export interface UserShare {
    ShareID: string;
    Type: number;
    Mask: number;
    LinkID: string;
    VolumeID: string;
    CreatorID: string;
    Flags: number;
}
