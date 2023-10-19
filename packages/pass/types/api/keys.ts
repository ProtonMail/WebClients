import type { KEY_FLAG } from '@proton/shared/lib/constants';

export type Key = {
    Flags: KEY_FLAG;
    PublicKey: string;
    Source: string;
};

export type SignedKeyList = {
    MinEpochID: number;
    MaxEpochID: number;
    ExpectedMinEpochID: number;
    Data: string;
    ObsolescenceToken: string;
    Signature: string;
    Revision: number;
};

export type GetAllPublicKeysResponse = { Address: { Keys: Key[] } };
