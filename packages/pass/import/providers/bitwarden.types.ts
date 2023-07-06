import type { MaybeNull } from '@proton/pass/types';

export enum BitwardenType {
    LOGIN = 1,
    NOTE = 2,
    CREDIT_CARD = 3,
    IDENTITY = 4,
}

export enum BitwardenCustomFieldType {
    TEXT = 0,
    HIDDEN = 1,
}

type BitwardenCustomField = {
    name: MaybeNull<string>;
    type: BitwardenCustomFieldType;
    value: MaybeNull<string>;
};

type BitwardenBaseItem = { name: string; notes: MaybeNull<string>; fields?: BitwardenCustomField[] };

export type BitwardenLoginItem = BitwardenBaseItem & {
    type: BitwardenType.LOGIN;
    login: {
        username: MaybeNull<string>;
        password: MaybeNull<string>;
        uris: MaybeNull<{ uri: string }[]>;
        totp: MaybeNull<string>;
    };
};

export type BitwardenCCItem = BitwardenBaseItem & {
    type: BitwardenType.CREDIT_CARD;
    card: {
        cardholderName: MaybeNull<string>;
        brand: MaybeNull<string>;
        number: MaybeNull<string>;
        expMonth: MaybeNull<string>;
        expYear: MaybeNull<string>;
        code: MaybeNull<string>;
    };
};

export type BitwardenIdentityItem = BitwardenBaseItem & {
    type: BitwardenType.IDENTITY;
};

export type BitwardenNoteItem = BitwardenBaseItem & { type: BitwardenType.NOTE };

type BitwardenItem = BitwardenLoginItem | BitwardenNoteItem | BitwardenCCItem | BitwardenIdentityItem;

export type BitwardenData = {
    encrypted: boolean;
    items: BitwardenItem[];
};
