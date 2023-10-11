import type { MaybeArray, UnsafeItemExtraField } from '@proton/pass/types';

export type KeePassEntryValue = { _ProtectInMemory: string; __text: string } | string;

export type KeePassCustomFields = { Key: string; Value: KeePassEntryValue }[];

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
        | { Key: string; Value: KeePassEntryValue };
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
    customFields: UnsafeItemExtraField[];
};
