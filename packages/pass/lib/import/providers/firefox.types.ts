import type { Maybe } from '@proton/pass/types';

export type FirefoxItem = {
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    httpRealm: Maybe<string>;
    formActionOrigin: Maybe<string>;
    guid: Maybe<string>;
    timeCreated: Maybe<number>;
    timeLastUsed: Maybe<number>;
    timePasswordChanged: Maybe<number>;
};
