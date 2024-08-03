import type { Maybe } from '@proton/pass/types';

export enum OnePassState {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    TRASHED = 'trashed',
}

export enum OnePassFieldType {
    TEXT = 'T',
    EMAIL = 'E',
    URL = 'U',
    NUMBER = 'N',
    PASSWORD = 'P',
    TEXTAREA = 'A',
    PHONE = 'TEL',
}

export enum OnePassLoginDesignation {
    USERNAME = 'username',
    PASSWORD = 'password',
}

export enum OnePassCategory {
    LOGIN = '001',
    CREDIT_CARD = '002',
    NOTE = '003',
    IDENTITY = '004',
    PASSWORD = '005',
    OTHER = '006',
}

export enum OnePassVaultType {
    PRIVATE = 'P',
    SHARED_WITH_EVERYONE = 'E',
    USER_CREATED = 'U',
}

export enum OnePassFieldKey {
    CONCEALED = 'concealed',
    CREDIT_CARD_NUMBER = 'creditCardNumber',
    MONTH_YEAR = 'monthYear',
    STRING = 'string',
    TOTP = 'totp',
    URL = 'url',
}

export type OnePassFields = { [K in OnePassFieldKey]?: K extends OnePassFieldKey.MONTH_YEAR ? number : string };

export enum OnePassCreditCardFieldId {
    CARDHOLDER = 'cardholder',
    CVV = 'cvv',
    EXPIRY = 'expiry',
    NUMBER = 'ccnum',
    TYPE = 'type',
    VALID_FROM = 'validFrom',
    PIN = 'pin',
}

export type OnePassCreditCardFields = { [K in OnePassCreditCardFieldId]?: OnePassField };

export const OnePassFieldValueKeys = Object.values(OnePassFieldKey);
export const OnePassCreditCardFieldIds = Object.values(OnePassCreditCardFieldId);

export type OnePassField = {
    title: string;
    id: string;
    value: OnePassFields;
};

export type ItemSection = {
    title: string;
    name: string;
    fields: OnePassField[];
};

export type OnePassItemDetails = {
    notesPlain: Maybe<string>;
    sections: Maybe<ItemSection[]>;
};

export type OnePassPassword = OnePassItemDetails & { password: string };
export type OnePassNote = OnePassItemDetails;
export type OnePassLogin = OnePassItemDetails & {
    loginFields: {
        value: string;
        name: Maybe<string>;
        type: OnePassFieldType;
        designation: OnePassLoginDesignation;
        notesPlain: Maybe<string>;
        sections: ItemSection[];
    }[];
};
export type OnePassCreditCard = OnePassItemDetails;
export type OnePassIdentity = OnePassItemDetails;

export type OnePassBaseItem = {
    uuid: string;
    favIndex: number;
    createdAt: number;
    updatedAt: number;
    state: OnePassState;
    categoryUuid: string;
    overview: {
        title: string;
        subtitle: string;
        url: string;
        urls: Maybe<{ label: string; url: string }[]>;
        tags: string[];
    };
};

export type OnePassItem = OnePassBaseItem &
    (
        | { categoryUuid: OnePassCategory.LOGIN; details: OnePassLogin }
        | { categoryUuid: OnePassCategory.NOTE; details: OnePassNote }
        | { categoryUuid: OnePassCategory.PASSWORD; details: OnePassPassword }
        | { categoryUuid: OnePassCategory.CREDIT_CARD; details: OnePassCreditCard }
        | { categoryUuid: OnePassCategory.IDENTITY; details: OnePassIdentity }
    );

export type OnePass1PuxData = {
    accounts: {
        attrs: {
            accountName: string;
            name: string;
            email: string;
            domain: string;
        };
        vaults: {
            attrs: {
                uuid: string;
                desc: string;
                name: string;
                avatar: string;
                type: OnePassVaultType;
            };
            items: OnePassItem[];
        }[];
    }[];
};

export const OnePasswordTypeMap: Record<string, string> = {
    '001': 'Login',
    '002': 'Credit Card',
    '003': 'Note',
    '004': 'Identification',
    '005': 'Password',
};
