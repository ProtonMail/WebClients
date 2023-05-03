import type { Maybe, MaybeArray } from '@proton/pass/types';

export type KeePassEntry = {
    String: [
        { Key: 'Title'; Value: string },
        { Key: 'UserName'; Value: string },
        { Key: 'Password'; Value: { __text: string } },
        { Key: 'URL'; Value: string },
        { Key: 'Notes'; Value: string },
        { Key: 'TimeOtp-Secret-Base32'; Value: string }
    ];
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
