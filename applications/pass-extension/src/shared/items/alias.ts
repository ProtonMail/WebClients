import type { MaybeNull } from '@proton/pass/types';
import { normalize } from '@proton/shared/lib/helpers/string';

import type { AliasFormValues, LoginItemFormValues } from '../form/types';
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
    aliasOptions: MaybeNull<SanitizedAliasOptions>,
    fallback?: Partial<AliasFormValues>
): AliasFormValues => {
    const { aliasSuffix, mailboxes, aliasPrefix } = aliasValues;
    const suffixOptions = aliasOptions?.suffixes ?? [];
    const mailboxOptions = aliasOptions?.mailboxes ?? [];

    const suffixMatch = suffixOptions.find(({ signature }) => signature === aliasSuffix?.signature);
    const mailboxesMatch = mailboxOptions.filter(({ id }) => mailboxes.some((mailbox) => id === mailbox.id));

    return {
        aliasPrefix: aliasPrefix,
        aliasSuffix: suffixMatch ?? fallback?.aliasSuffix,
        mailboxes: mailboxesMatch.length > 0 ? mailboxesMatch : fallback?.mailboxes ?? [],
    };
};

export const sanitizeLoginAliasSave = (formData: LoginItemFormValues): LoginItemFormValues => {
    const { username, aliasPrefix, aliasSuffix } = formData;

    if (aliasSuffix !== undefined && username !== `${aliasPrefix}${aliasSuffix.value}`) {
        return {
            ...formData,
            withAlias: false,
            aliasPrefix: '',
            aliasSuffix: undefined,
            mailboxes: [],
        };
    }

    return formData;
};

export const sanitizeLoginAliasHydration =
    (aliasOptions: MaybeNull<SanitizedAliasOptions>) =>
    (formData: LoginItemFormValues): LoginItemFormValues => {
        if (!formData.withAlias) return formData;

        const aliasValues = reconciliateAliasFromDraft(formData, aliasOptions);
        const withAlias = aliasValues.aliasSuffix !== undefined && aliasValues.mailboxes.length > 0;
        return { ...formData, ...aliasValues, withAlias, username: withAlias ? formData.username : '' };
    };
