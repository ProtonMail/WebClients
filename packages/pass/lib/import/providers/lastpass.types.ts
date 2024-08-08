import type { Maybe } from '@proton/pass/types';

export enum LastPassNoteType {
    CREDIT_CARD = 'Credit Card',
    ADDRESS = 'Address',
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
