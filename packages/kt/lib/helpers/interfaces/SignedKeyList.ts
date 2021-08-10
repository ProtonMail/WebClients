export interface SignedKeyList {
    Data: string;
    Signature: string;
}

export interface SignedKeyListEpochs extends SignedKeyList {
    MinEpochID?: number | null;
    MaxEpochID?: number | null;
}
