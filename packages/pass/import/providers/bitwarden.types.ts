import type { MaybeNull } from '@proton/pass/types';

export enum BitwardenType {
    LOGIN = 1,
    NOTE = 2,
    CREDIT_CARD = 3,
    IDENTITY = 4,
}

type BitwardenBaseItem = { name: string; notes: MaybeNull<string> };

type BitwardenItem = BitwardenBaseItem &
    (
        | {
              type: BitwardenType.NOTE;
          }
        | {
              type: BitwardenType.LOGIN;
              login: {
                  username: MaybeNull<string>;
                  password: MaybeNull<string>;
                  uris: MaybeNull<{ uri: string }[]>;
                  totp: MaybeNull<string>;
              };
          }
        | {
              type: BitwardenType.CREDIT_CARD;
              card: {
                  cardholderName: MaybeNull<string>;
                  brand: MaybeNull<string>;
                  number: MaybeNull<number>;
                  expMonth: MaybeNull<number>;
                  expYear: MaybeNull<number>;
                  code: MaybeNull<number>;
              };
          }
    );

export type BitwardenData = {
    encrypted: boolean;
    items: BitwardenItem[];
};
