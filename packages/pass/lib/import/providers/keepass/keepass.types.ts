import type { DeobfuscatedItemExtraField, Maybe, MaybeArray } from '@proton/pass/types';

export type KeePassEntryValue = { _ProtectInMemory: string; __text: string } | string;

type KeePassField = Maybe<{ Key: string; Value: KeePassEntryValue }>;

export type KeePassCustomFields = KeePassField[];

export type KeePassEntry = {
    String:
        | [
              { Key: 'Title'; Value: KeePassEntryValue },
              { Key: 'UserName'; Value: KeePassEntryValue },
              { Key: 'Password'; Value: KeePassEntryValue },
              { Key: 'URL'; Value: KeePassEntryValue },
              { Key: 'Notes'; Value: KeePassEntryValue },
              { Key: 'otp'; Value: KeePassEntryValue },
              ...KeePassCustomFields,
          ]
        | KeePassField;
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
    name?: string;
    url?: string;
    username?: string;
    password?: string;
    note?: string;
    otpauth?: string;
    totpSeed?: string;
    totpSettings?: string;
    customFields: DeobfuscatedItemExtraField[];
};
