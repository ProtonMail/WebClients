export interface SignedKeyList {
    Data: string;
    Signature: string;
}

export interface SignedKeyListItem {
    Primary: 0 | 1;
    Flags: number;
    Fingerprint: string;
    SHA256Fingerprints: string[];
}
