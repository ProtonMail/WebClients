import { OpenPGPKey } from 'pmcrypto';
import { Address, DecryptedKey, Key, UserModel } from 'proton-shared/lib/interfaces';

export enum Status {
    INACTIVE = 1,
    UPLOADED = 2,
    SUCCESS = 3,
    LOADING = 4,
    ERROR = 5,
}

export interface KeyReactivationRequestStateData {
    id: string;
    Key: Key;
    key?: OpenPGPKey;
    fingerprint: string;
    uploadedPrivateKey?: OpenPGPKey;
    status: Status;
    result?: 'ok' | Error;
}

export type KeyReactivationRequestState =
    | {
          user: UserModel;
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
          user: UserModel;
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
