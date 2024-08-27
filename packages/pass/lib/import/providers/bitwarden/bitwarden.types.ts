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

export type BitwardenCustomField = {
    name: MaybeNull<string>;
    type: BitwardenCustomFieldType;
    value: MaybeNull<string>;
};

type BitwardenBaseItem = {
    name: string;
    notes: MaybeNull<string>;
    fields?: BitwardenCustomField[];

    /** Always `null` on org exports, see `collectionIds` instead */
    folderId: MaybeNull<string>;

    /** Specific to org exports, has precedence over `folderId`
     * which will be present but always null. */
    collectionIds?: string[];
};

type BitwardenFolder = { id: string; name: string };

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
    identity: {
        firstName: string;
        middleName: string;
        lastName: string;
        address1: string;
        address2: string;
        address3: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        company: string;
        email: string;
        phone: string;
        ssn: string;
        username: string;
        passportNumber: string;
        licenseNumber: string;
    };
};

export type BitwardenNoteItem = BitwardenBaseItem & { type: BitwardenType.NOTE };

export type BitwardenItem = BitwardenLoginItem | BitwardenNoteItem | BitwardenCCItem | BitwardenIdentityItem;

export type BitwardenData = {
    encrypted: boolean;
    items: BitwardenItem[];
    folders?: BitwardenFolder[];
    collections?: BitwardenFolder[];
};
