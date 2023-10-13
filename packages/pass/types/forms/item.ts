import type { AliasMailbox } from '@proton/pass/types';

import type { ExtraFieldGroupValues, UrlGroupValues } from './fields';

export type BaseItemValues = { name: string; note: string };

export type NoteFormValues = {
    name: string;
    note: string;
    shareId: string;
};

export type LoginItemFormValues = {
    name: string;
    shareId: string;
    username: string;
    password: string;
    note: string;
    totpUri: string;
    withAlias: boolean;
} & AliasFormValues &
    UrlGroupValues &
    ExtraFieldGroupValues;

export type EditLoginItemFormValues = LoginItemFormValues;
export type NewLoginItemFormValues = LoginItemFormValues;

export type AliasFormValues = {
    aliasPrefix: string;
    aliasSuffix?: { signature: string; value: string };
    mailboxes: AliasMailbox[];
};

export type NewAliasFormValues = AliasFormValues & {
    name: string;
    note: string;
    shareId: string;
};

export type EditAliasFormValues = Pick<AliasFormValues, 'mailboxes'> & {
    name: string;
    note: string;
};
