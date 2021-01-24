import { OpenPGPKey } from 'pmcrypto';

export interface OrganizationKey {
    PrivateKey?: string;
    PublicKey: string;
}

export interface CachedOrganizationKey {
    Key: OrganizationKey;
    privateKey?: OpenPGPKey;
    error?: Error;
}
