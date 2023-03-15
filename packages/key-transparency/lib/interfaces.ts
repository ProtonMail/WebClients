import { PublicKeyReference } from '@proton/crypto';
import { FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { KT_CERTIFICATE_ISSUER, KT_DOMAINS } from './constants';

export interface KeyWithFlags {
    Flags: number;
    PublicKey: PublicKeyReference;
}

export enum KTPROOF_TYPE {
    ABSENCE,
    EXISTENCE,
    OBSOLESCENCE,
}

export interface Proof {
    Neighbors: (string | null)[];
    Verifier: string;
    Revision: number;
    Type: KTPROOF_TYPE;
    ObsolescenceToken: string | null;
}

export interface PartialKTBlobContent {
    creationTimestamp: number;
    PublicKeys: string[];
    email: string;
    isObsolete: boolean;
}

export interface KTBlobContent extends PartialKTBlobContent {
    ExpectedMinEpochID: number;
}

export interface KTBlobValuesWithInfo {
    userID: string;
    addressID: string;
    ktBlobsContent: KTBlobContent[];
}

export interface VerifiedEpoch {
    EpochID: number;
    Revision: number;
}

export interface AuditData {
    initialEpoch: VerifiedEpoch;
    newSKLs: FetchedSignedKeyList[];
}

export enum KT_STATUS {
    KT_FAILED,
    KT_PASSED,
    KT_MINEPOCHID_NULL,
}

export interface Epoch {
    EpochID: number;
    TreeHash: string;
    ChainHash: string;
    PrevChainHash: string;
    Certificate: string;
    CertificateIssuer: KT_CERTIFICATE_ISSUER;
    ClaimedTime: number;
    Domain: KT_DOMAINS;
    CertificateTime: number;
}
