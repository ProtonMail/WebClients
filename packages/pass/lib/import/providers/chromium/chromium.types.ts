import type { Maybe } from '../../../../types/utils';

export type ChromiumItem = {
    name: Maybe<string>;
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
};
