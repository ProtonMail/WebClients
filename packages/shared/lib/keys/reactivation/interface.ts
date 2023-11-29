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

export type OnKeyReactivationCallback = (id: string, result: 'ok' | Error) => void;

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
