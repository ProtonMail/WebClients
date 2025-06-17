import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type {
    AliasMailbox,
    DeobfuscatedItemExtraField,
    FileAttachmentValues,
    ItemContent,
} from '@proton/pass/types/data';
import type { ExtractKeysOfType } from '@proton/pass/types/utils';

import type { ItemCustomType } from '@proton/pass/types/protobuf';
import type { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import type { CustomSectionGroupValues, ExtraFieldGroupValues, UrlGroupValues } from './fields';

export type BaseItemValues = {
    name: string;
    note: string;
    shareId: string;
} & FileAttachmentValues &
    ExtraFieldGroupValues;

export type NoteFormValues = BaseItemValues;

export type LoginItemFormValues = BaseItemValues & {
    itemEmail: string;
    itemUsername: string;
    passkeys: SanitizedPasskey[];
    password: string;
    totpUri: string;
    withAlias: boolean;
    withUsername: boolean;
} & AliasFormValues &
    UrlGroupValues;

export type AliasFormValues = {
    aliasPrefix: string;
    aliasSuffix?: { signature: string; value: string };
    mailboxes: AliasMailbox[];
};

export type DomainFormValues = { domain: string };

export type AliasContactValues = { name: string };
export type AliasCreateContactValues = { email: string };
export type NewAliasFormValues = BaseItemValues & AliasFormValues;
export type EditAliasFormValues = BaseItemValues &
    Pick<AliasFormValues, 'mailboxes'> & {
        displayName: string;
        slNote: string;
    };

export type IdentityValues = ItemContent<'identity'>;
export type IdentityItemFormValues = { shareId: string } & BaseItemValues & IdentityValues;
export type ItemSectionFormValues = { sectionName: string };
export type IdentityFieldName = ExtractKeysOfType<IdentityValues, string>;
export type IdentityExtraFieldsKey = ExtractKeysOfType<IdentityValues, DeobfuscatedItemExtraField[]>;

export type CreditCardItemFormValues = BaseItemValues & {
    shareId: string;
    name: string;
    cardholderName: string;
    number: string;
    expirationDate: string;
    verificationNumber: string;
    pin: string;
    note: string;
};

export type CustomItemFormValues<T extends ItemCustomType = ItemCustomType> = Extract<
    BaseItemValues &
        CustomSectionGroupValues &
        (
            | { type: 'wifi'; password: string; security: WifiSecurity; ssid: string }
            | { type: 'sshKey'; privateKey: string; publicKey: string }
            | { type: 'custom' }
        ),
    { type: T }
>;
