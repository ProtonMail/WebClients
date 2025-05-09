import type { ItemImportIntent, Maybe } from '@proton/pass/types';

export enum DashlaneFileKey {
    Login = 'Login',
    Ids = 'Ids',
    Payments = 'Payments',
    PersonalInfo = 'PersonalInfo',
    SecureNotes = 'SecureNotes',
}

export type DashlaneLoginItem = {
    username: Maybe<string>;
    username2: Maybe<string>;
    username3: Maybe<string>;
    title: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
    url: Maybe<string>;
    category: Maybe<string>;
    /** OTP field in older Dashlane versions */
    otpSecret: Maybe<string>;
    /** OTP field in latest Dashlane version (tested on 16th October 2024) */
    otpUrl: Maybe<string>;
};

export type DashlaneNoteItem = {
    title: Maybe<string>;
    note: Maybe<string>;
};

export type DashlaneIdItem = {
    type: Maybe<string>;
    number: Maybe<string>;
    name: Maybe<string>;
    issue_date: Maybe<string>;
    expiration_date: Maybe<string>;
    place_of_issue: Maybe<string>;
    state: Maybe<string>;
};

export type DashlanePaymentItem = {
    type: Maybe<string>;
    account_name: Maybe<string>;
    account_holder: Maybe<string>;
    cc_number: Maybe<string>;
    code: Maybe<string>;
    expiration_month: Maybe<string>;
    expiration_year: Maybe<string>;
    routing_number: Maybe<string>;
    account_number: Maybe<string>;
    country: Maybe<string>;
    issuing_bank: Maybe<string>;
    note: Maybe<string>;
    name: Maybe<string>;
};

export type DashlanePersonalInfoItem = {
    type: Maybe<string>;
    address: Maybe<string>;
    address_apartment: Maybe<string>;
    address_building: Maybe<string>;
    address_door_code: Maybe<string>;
    address_floor: Maybe<string>;
    address_recipient: Maybe<string>;
    city: Maybe<string>;
    country: Maybe<string>;
    date_of_birth: Maybe<string>;
    email: Maybe<string>;
    email_type: Maybe<string>;
    first_name: Maybe<string>;
    item_name: Maybe<string>;
    job_title: Maybe<string>;
    last_name: Maybe<string>;
    login: Maybe<string>;
    middle_name: Maybe<string>;
    phone_number: Maybe<string>;
    place_of_birth: Maybe<string>;
    state: Maybe<string>;
    title: Maybe<string>;
    url: Maybe<string>;
    zip: Maybe<string>;
};

export type DashlaneItem =
    | DashlaneLoginItem
    | DashlaneNoteItem
    | DashlaneIdItem
    | DashlanePaymentItem
    | DashlanePersonalInfoItem;

export type ValidDashlaneItemKeys =
    | keyof DashlaneLoginItem
    | keyof DashlaneNoteItem
    | keyof DashlanePaymentItem
    | keyof DashlaneIdItem
    | keyof DashlanePersonalInfoItem;

export type DashlaneItemParser<T extends DashlaneItem = DashlaneItem> = (item: T) => ItemImportIntent;
export type DashlaneItemAsyncParser<T extends DashlaneItem = DashlaneItem> = (item: T) => Promise<ItemImportIntent>;
