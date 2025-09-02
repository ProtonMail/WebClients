import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { SanitizedAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import type {
    AliasContactValues,
    AliasFormValues,
    EditAliasFormValues,
    LoginItemFormValues,
    Maybe,
    MaybeNull,
    NewAliasFormValues,
} from '@proton/pass/types';

import { validateItemErrors } from './item';

export const validateAliasPrefix = async (prefix: string = ''): Promise<Maybe<string>> => {
    try {
        await PassUI.validate_alias_prefix(prefix);
    } catch (err) {
        switch (err instanceof Error && err.message) {
            case 'PrefixEmpty':
                return c('Warning').t`Missing alias prefix`;
            case 'PrefixTooLong':
                return c('Warning').t`The alias prefix cannot be longer than 40 characters`;
            case 'InvalidCharacter':
                return c('Warning')
                    .t`Only alphanumeric lowercase characters, dots, hyphens and underscores are allowed`;
            case 'TwoConsecutiveDots':
                return c('Warning').t`2 consecutive dots are not allowed`;
            case 'DotAtTheBeginning':
                return c('Warning').t`Cannot contain a dot at the beginning`;
            case 'DotAtTheEnd':
                return c('Warning').t`Cannot contain a dot at the end`;
            default:
                return c('Warning').t`Invalid alias prefix`;
        }
    }
};

export const validateAliasForm = async ({
    aliasPrefix,
    mailboxes,
    aliasSuffix,
}: AliasFormValues): Promise<FormikErrors<AliasFormValues>> => {
    const errors: FormikErrors<AliasFormValues> = {};

    const aliasPrefixError = await validateAliasPrefix(aliasPrefix);
    if (aliasPrefixError) errors.aliasPrefix = aliasPrefixError;

    if (!aliasSuffix) errors.aliasSuffix = c('Warning').t`Missing alias suffix`;
    if (mailboxes.length === 0) errors.mailboxes = c('Warning').t`You must select at least one mailbox`;

    return errors;
};

export const validateNewAliasForm = async (values: NewAliasFormValues): Promise<FormikErrors<NewAliasFormValues>> => ({
    ...validateItemErrors(values),
    ...(await validateAliasForm(values)),
});

export const validateAliasContactSenderName = ({ name }: AliasContactValues): FormikErrors<AliasContactValues> => {
    const errors: FormikErrors<AliasContactValues> = {};
    if (!name) errors.name = c('Warning').t`Name is required`;

    return errors;
};

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
