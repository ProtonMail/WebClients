import type { Maybe } from '@proton/pass/types';

export enum NordPassType {
    LOGIN = 'password',
    CREDIT_CARD = 'credit_card',
    IDENTITY = 'identity',
    NOTE = 'note',
}

export type NordPassItem = {
    name: Maybe<string>;
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
    cardholdername: Maybe<string>;
    cardnumber: Maybe<string>;
    cvc: Maybe<string>;
    expirydate: Maybe<string>;
    zipcode: Maybe<string>;
    folder: Maybe<string>;
    full_name: Maybe<string>;
    phone_number: Maybe<string>;
    email: Maybe<string>;
    address1: Maybe<string>;
    address2: Maybe<string>;
    city: Maybe<string>;
    country: Maybe<string>;
    state: Maybe<string>;
    type: Maybe<NordPassType>;
};
