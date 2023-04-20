import type { Maybe } from '@proton/pass/types';

export type ChromeItem = {
    name: Maybe<string>;
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
};
