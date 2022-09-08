import { Address, DecryptedKey, Key, User } from '@proton/shared/lib/interfaces';

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
          keys: DecryptedKey[];
          keysToReactivate: KeyReactivationRequestStateData[];
      }
    | {
          user: undefined;
          address: Address;
          keys: DecryptedKey[];
          keysToReactivate: KeyReactivationRequestStateData[];
      };

export type KeyReactivationRequest =
    | {
          user: User;
          address?: undefined;
          keys: DecryptedKey[];
          keysToReactivate: Key[];
      }
    | {
          user?: undefined;
          address: Address;
          keys: DecryptedKey[];
          keysToReactivate: Key[];
      };
