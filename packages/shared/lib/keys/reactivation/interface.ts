import { OpenPGPKey } from 'pmcrypto';

import { Address, DecryptedKey, Key, User } from '../../interfaces';

export interface KeyReactivationData {
    id: string;
    Key: Key;
    privateKey?: OpenPGPKey;
}

export type KeyReactivationRecord =
    | {
          user: User;
          address?: undefined;
          keys: DecryptedKey[];
          keysToReactivate: KeyReactivationData[];
      }
    | {
          user?: undefined;
          address: Address;
          keys: DecryptedKey[];
          keysToReactivate: KeyReactivationData[];
      };

export type OnKeyReactivationCallback = (id: string, result: 'ok' | Error) => void;
