import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

import type { MEMBER_ORG_KEY_STATE } from './Member';

export interface OrganizationKey {
    LegacyPrivateKey?: string;
    PrivateKey?: string;
    Token?: string;
    Signature?: string;
    SignatureAddress?: string | null;
    AccessToOrgKey?: MEMBER_ORG_KEY_STATE;
    EncryptionAddressID?: string;
    Passwordless?: boolean;
}

export type PasswordlessOrganizationKey = OrganizationKey &
    Required<Pick<OrganizationKey, 'Token' | 'Signature' | 'PrivateKey'>>;

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
