import { PublicKeyReference } from '@proton/crypto';
import { FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { KT_CERTIFICATE_ISSUER, KT_DOMAINS } from './constants';
import { KeyTransparencyError } from './helpers';

export interface KeyWithFlags {
    Flags: number;
    PublicKey: PublicKeyReference;
    Primary?: 0 | 1;
}

export enum KTPROOF_TYPE {
    ABSENCE,
    EXISTENCE,
    OBSOLESCENCE,
}

export interface Proof {
    Neighbors: (string | null)[];
    Verifier: string;
    Type: KTPROOF_TYPE;
    ObsolescenceToken: string | null;
}

export interface KTBlobContent {
    creationTimestamp: number;
    expectedMinEpochID: number;
    email: string;
    data: string;
    revision: number;
    isCatchall?: boolean;
}

export interface KTBlobValuesWithInfo {
    userID: string;
    addressID: string;
    ktBlobsContent: KTBlobContent[];
}

export interface VerifiedEpoch {
    EpochID: number;
    Revision: number;
    SKLCreationTime: number;
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

export enum AddressAuditStatus {
    Success,
    Failure,
    Warning,
}

export enum AddressAuditWarningReason {
    UnverifiableHistory,
}

export interface AddressAuditWarningDetails {
    reason: AddressAuditWarningReason;
    addressWasDisabled?: boolean;
    sklVerificationFailed?: boolean;
}

export interface AddressAuditResult {
    email: string;
    status: AddressAuditStatus;
    warningDetails?: AddressAuditWarningDetails;
    error?: KeyTransparencyError;
}

export interface LocalStorageAuditResult {
    email: string;
    success: boolean;
    error?: KeyTransparencyError;
    primaryKeyFingerprint?: string;
}

export interface SelfAuditResult {
    auditTime: number;
    nextAuditTime: number;
    addressAuditResults: AddressAuditResult[];
    localStorageAuditResultsOwnAddress: LocalStorageAuditResult[];
    localStorageAuditResultsOtherAddress: LocalStorageAuditResult[];
    error?: SelfAuditError;
}

export interface SelfAuditError {
    failedTrials: number;
    tooManyRetries: boolean;
}
