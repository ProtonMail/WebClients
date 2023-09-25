import type { MIME_TYPES, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
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

export type PublicKeysResponse = {
    Code: number;
    RecipientType: RECIPIENT_TYPES;
    IgnoreKT: number;
    MIMEType: MIME_TYPES;
    Keys: Key[];
    SignedKeyList: SignedKeyList;
    Warnings: string[];
    IsProton: number;
};
