import type { Maybe } from '../../../../types';

export type RoboformVariadicItem = [string, string, string, string, string, string, string, ...string[]];

export type RoboformItem = {
    Name: Maybe<string>;
    Url: Maybe<string>;
    MatchUrl: Maybe<string>;
    Login: Maybe<string>;
    Pwd: Maybe<string>;
    Note: Maybe<string>;
    Folder: Maybe<string>;
    RfFieldsV2: Maybe<string[]>;
};
