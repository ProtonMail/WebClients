import type { Maybe } from '@proton/pass/types';

export type DashlaneLoginItem = {
    username: Maybe<string>;
    title: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
    url: Maybe<string>;
    category: Maybe<string>;
    otpSecret: Maybe<string>;
};
