import type { Maybe } from '@proton/pass/types';

export type ChromiumItem = {
    name: Maybe<string>;
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
};
