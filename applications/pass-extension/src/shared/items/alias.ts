import type { MaybeNull } from '@proton/pass/types';
import { normalize } from '@proton/shared/lib/helpers/string';

import type { AliasFormValues } from '../form/types';
import type { SanitizedAliasOptions } from '../hooks';

/* Normalize unicode representation of the string
 * Remove diacritics (accents) + 20 max characters length
 * for the auto-derived alias name. Removes trailing dots. */
export const deriveAliasPrefix = (name: string) => {
    const prefix = normalize(name, true)
        .replace(/[^a-z0-9\-\_.]/g, '')
        .slice(0, 20);

    return prefix.replace(/\.*$/, '');
};

export const reconciliateAliasFromDraft = <V extends AliasFormValues>(
    aliasValues: V,
    aliasOptions: MaybeNull<SanitizedAliasOptions>
): AliasFormValues => {
    const { aliasSuffix, mailboxes, aliasPrefix } = aliasValues;
    const suffixOptions = aliasOptions?.suffixes ?? [];
    const mailboxOptions = aliasOptions?.mailboxes ?? [];

    const suffixMatch = suffixOptions.find(({ signature }) => signature === aliasSuffix?.signature);
    const mailboxesMatch = mailboxOptions.filter(({ id }) => mailboxes.some((mailbox) => id === mailbox.id));

    return {
        aliasPrefix: aliasPrefix,
        aliasSuffix: suffixMatch,
        mailboxes: mailboxesMatch,
    };
};
