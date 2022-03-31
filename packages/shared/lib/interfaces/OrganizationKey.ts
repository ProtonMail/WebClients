import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

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
          privateKey: PrivateKeyReference;
          publicKey: PublicKeyReference;
          error?: undefined;
      };
