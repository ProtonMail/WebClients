import type { PrivateKeyReference } from '@proton/crypto';

import type { Address, InactiveKey, Key, User } from '../../interfaces';

export interface KeyReactivationData {
    id: string;
    Key: Key;
    privateKey?: PrivateKeyReference;
}

export type KeyReactivationRecord =
    | {
          user: User;
          address?: undefined;
          keysToReactivate: KeyReactivationData[];
      }
    | {
          user?: undefined;
          address: Address;
          keysToReactivate: KeyReactivationData[];
      };

export interface KeyReactivationRequestStateData {
    id: string;
    Key: Key;
    fingerprint: string;
    result?: 'ok' | Error;
}

export type KeyReactivationRequestState =
    | {
          user: User;
          address: undefined;
          keysToReactivate: KeyReactivationRequestStateData[];
      }
    | {
          user: undefined;
          address: Address;
          keysToReactivate: KeyReactivationRequestStateData[];
      };

export type KeyReactivationRequest =
    | {
          user: User;
          address?: undefined;
          keysToReactivate: InactiveKey[];
      }
    | {
          user?: undefined;
          address: Address;
          keysToReactivate: InactiveKey[];
      };

export type ReactivateKeyResult =
    | {
          id: string;
          type: 'success';
      }
    | {
          id: string;
          type: 'error';
          error: Error;
      };

export interface ReactivateKeysResult {
    details: ReactivateKeyResult[];
}
