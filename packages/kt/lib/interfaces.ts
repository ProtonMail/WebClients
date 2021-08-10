import { KT_STATUS } from './constants';

export interface Epoch {
    EpochID: number;
    TreeHash: string;
    ChainHash: string;
    PrevChainHash: string;
    Certificate: string;
    IssuerKeyHash: string;
}

export interface EpochExtended extends Epoch {
    Revision: number;
    CertificateDate: number;
}

export interface KeyInfo {
    Fingerprint: string;
    SHA256Fingerprints: string[];
    Primary: number;
    Flags: number;
}

export interface Proof {
    Neighbors: (string | null)[];
    Proof: string;
    Revision: number;
    Name: string;
}

export interface KTInfo {
    code: KT_STATUS;
    error: string;
}

export interface KTInfoSelfAudit extends KTInfo {
    verifiedEpoch?: EpochExtended;
}

export interface KTInfoToLS {
    message: string;
    addressID: string;
}
