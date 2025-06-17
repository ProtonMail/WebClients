import type { Maybe } from '@proton/pass/types';

export enum NordPassType {
    LOGIN = 'password',
    CREDIT_CARD = 'credit_card',
    IDENTITY = 'identity',
    NOTE = 'note',
}

export type NordPassItem = {
    additional_urls?: string;
    address1: Maybe<string>;
    address2: Maybe<string>;
    cardholdername: Maybe<string>;
    cardnumber: Maybe<string>;
    city: Maybe<string>;
    country: Maybe<string>;
    custom_fields?: string;
    cvc: Maybe<string>;
    email: Maybe<string>;
    expirydate: Maybe<string>;
    folder: Maybe<string>;
    full_name: Maybe<string>;
    name: Maybe<string>;
    note: Maybe<string>;
    password: Maybe<string>;
    phone_number: Maybe<string>;
    state: Maybe<string>;
    type: Maybe<NordPassType>;
    url: Maybe<string>;
    username: Maybe<string>;
    zipcode: Maybe<string>;
};

export type NordPassExtraField = {
    label: string;
    type: 'text' | 'hidden' | 'date';
    value: string;
};
