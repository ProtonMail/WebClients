import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { AliasMailbox, ItemContent, UnsafeItemExtraField } from '@proton/pass/types/data';
import type { ExtractKeysOfType } from '@proton/pass/types/utils';

import type { ExtraFieldGroupValues, UrlGroupValues } from './fields';

export type BaseItemValues = { name: string; note: string; shareId: string };

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
    UrlGroupValues &
    ExtraFieldGroupValues;

export type AliasFormValues = {
    aliasPrefix: string;
    aliasSuffix?: { signature: string; value: string };
    mailboxes: AliasMailbox[];
};

export type NewAliasFormValues = BaseItemValues & AliasFormValues;
export type EditAliasFormValues = BaseItemValues & Pick<AliasFormValues, 'mailboxes'>;

export type IdentityValues = ItemContent<'identity'>;
export type IdentityItemFormValues = { shareId: string } & BaseItemValues & IdentityValues;
export type IdentitySectionFormValues = { sectionName: string };
export type IdentityFieldName = ExtractKeysOfType<IdentityValues, string>;
export type IdentityExtraFieldsKey = ExtractKeysOfType<IdentityValues, UnsafeItemExtraField[]>;
