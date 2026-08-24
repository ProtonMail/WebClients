import type { Maybe } from '../../../../types';

export type SafariItem = {
    Title: Maybe<string>;
    URL: Maybe<string>;
    Username: Maybe<string>;
    Password: Maybe<string>;
    Notes: Maybe<string>;
    OTPAuth: Maybe<string>;
};
