import { OpenPGPKey } from 'pmcrypto';

export interface OrganizationKey {
    PrivateKey?: string;
    PublicKey: string;
}

export type CachedOrganizationKey =
    | {
          Key: OrganizationKey;
          privateKey?: undefined;
          publicKey?: undefined;
          error?: Error;
      }
    | {
          Key: OrganizationKey;
          privateKey: OpenPGPKey;
          publicKey: OpenPGPKey;
          error?: undefined;
      };
