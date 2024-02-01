import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

export interface OrganizationKey {
    PrivateKey?: string;
}

export type CachedOrganizationKey =
    | {
          Key: OrganizationKey;
          privateKey?: undefined;
          publicKey?: undefined;
          error?: Error;
          placeholder?: boolean;
      }
    | {
          Key: OrganizationKey;
          privateKey: PrivateKeyReference;
          publicKey: PublicKeyReference;
          error?: undefined;
          placeholder?: boolean;
      };
