import type { Maybe } from '@proton/pass/types';

export enum LastPassNoteType {
    CREDIT_CARD = 'Credit Card',
    ADDRESS = 'Address',
    SSH_KEY = 'SSH Key',
    WIFI_PASSWORD = 'Wi-Fi Password',
}

export type LastPassItem = {
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    totp: Maybe<string>;
    extra: Maybe<string>;
    name: Maybe<string>;
    grouping: Maybe<string>;
    fav: Maybe<string>;
};
