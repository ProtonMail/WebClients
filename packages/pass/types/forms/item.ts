import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { AliasMailbox, ItemContent } from '@proton/pass/types';

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
