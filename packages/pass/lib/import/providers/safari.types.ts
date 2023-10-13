import type { Maybe } from '@proton/pass/types';

export type SafariItem = {
    Title: Maybe<string>;
    URL: Maybe<string>;
    Username: Maybe<string>;
    Password: Maybe<string>;
    Notes: Maybe<string>;
    OTPAuth: Maybe<string>;
};
