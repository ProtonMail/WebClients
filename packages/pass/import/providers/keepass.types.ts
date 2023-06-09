import type { Maybe, MaybeArray } from '@proton/pass/types';

export type KeyPassEntryValue = { __text: string } | string;

export type KeePassEntry = {
    String:
        | [
              { Key: 'Title'; Value: KeyPassEntryValue },
              { Key: 'UserName'; Value: KeyPassEntryValue },
              { Key: 'Password'; Value: KeyPassEntryValue },
              { Key: 'URL'; Value: KeyPassEntryValue },
              { Key: 'Notes'; Value: KeyPassEntryValue },
              { Key: 'otp'; Value: KeyPassEntryValue }
          ]
        | { Key: string; Value: KeyPassEntryValue };
};

export type KeePassGroup = {
    Name: string;
    Entry?: MaybeArray<KeePassEntry>;
    Group?: MaybeArray<KeePassGroup>;
};

export type KeePassFile = {
    KeePassFile: {
        Root: {
            Group?: MaybeArray<KeePassGroup>;
        };
    };
};

export type KeePassItem = {
    name: Maybe<string>;
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
    totp: Maybe<string>;
};
