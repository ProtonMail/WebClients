import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { SanitizedAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import PassCoreUI from '@proton/pass/lib/core/core.ui';
import type {
    AliasFormValues,
    EditAliasFormValues,
    LoginItemFormValues,
    Maybe,
    MaybeNull,
    NewAliasFormValues,
} from '@proton/pass/types';
import { normalize } from '@proton/shared/lib/helpers/string';

import { validateItemErrors } from './item';

/* Normalize unicode representation of the string
 * Remove diacritics (accents) + 20 max characters length
 * for the auto-derived alias name.
 * Removes trailing/leading dots. */
export const deriveAliasPrefix = (name: string) => {
    const prefix = normalize(name, true)
        .replace(/[^a-z0-9\-\_.]/g, '')
        .slice(0, 20);

    return prefix.replace(/\.*$/, '').replace(/^\.+/, '');
};

export const validateAliasPrefix = (prefix: string = ''): Maybe<string> => {
    try {
        PassCoreUI.validate_alias_prefix(prefix);
        return;
    } catch (err) {
        switch (err instanceof Error && err.message) {
            case 'PrefixEmpty':
                return c('Warning').t`Missing alias prefix`;
            case 'PrefixTooLong':
                return c('Warning').t`The alias prefix cannot be longer than 40 characters`;
            case 'InvalidCharacter':
                return c('Warning').t`Only alphanumeric characters, dots, hyphens and underscores are allowed`;
            case 'TwoConsecutiveDots':
            case 'DotAtTheBeginning':
            case 'DotAtTheEnd':
            default:
                return c('Warning').t`Invalid alias prefix`;
        }
    }
};

export const validateAliasForm = ({
    aliasPrefix,
    mailboxes,
    aliasSuffix,
}: AliasFormValues): FormikErrors<AliasFormValues> => {
    const errors: FormikErrors<AliasFormValues> = {};

    const aliasPrefixError = validateAliasPrefix(aliasPrefix);
    if (aliasPrefixError) errors.aliasPrefix = aliasPrefixError;

    if (!aliasSuffix) errors.aliasSuffix = c('Warning').t`Missing alias suffix`;
    if (mailboxes.length === 0) errors.mailboxes = c('Warning').t`You must select at least one mailbox`;

    return errors;
};

export const validateNewAliasForm = (values: NewAliasFormValues): FormikErrors<NewAliasFormValues> => ({
    ...validateItemErrors(values),
    ...validateAliasForm(values),
});

export const createEditAliasFormValidator =
    (aliasOwner: boolean) =>
    (values: EditAliasFormValues): FormikErrors<EditAliasFormValues> => {
        const errors: FormikErrors<EditAliasFormValues> = validateItemErrors(values);

        if (aliasOwner && values.mailboxes.length === 0) {
            errors.mailboxes = c('Warning').t`You must select at least one mailbox`;
        }

        return errors;
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
        mailboxes: mailboxesMatch.length > 0 ? mailboxesMatch : (fallback?.mailboxes ?? []),
    };
};

export const sanitizeLoginAliasSave = (formData: LoginItemFormValues): LoginItemFormValues => {
    const { itemEmail, aliasPrefix, aliasSuffix } = formData;

    if (aliasSuffix !== undefined && itemEmail !== `${aliasPrefix}${aliasSuffix.value}`) {
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
        return { ...formData, ...aliasValues, withAlias, itemEmail: withAlias ? formData.itemEmail : '' };
    };
