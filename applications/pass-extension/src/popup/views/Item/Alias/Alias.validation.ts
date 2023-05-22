import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { AliasMailbox } from '@proton/pass/types/data/alias';
import { validateLocalPart } from '@proton/shared/lib/helpers/email';

import { validateItemErrors } from '../Item/Item.validation';

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

export const validateAliasForm = ({
    aliasPrefix,
    mailboxes,
    aliasSuffix,
}: AliasFormValues): FormikErrors<AliasFormValues> => {
    const errors: FormikErrors<AliasFormValues> = {};

    if (aliasPrefix === undefined || !validateLocalPart(aliasPrefix + (aliasSuffix?.value?.split('@')?.[0] ?? ''))) {
        errors.aliasPrefix = c('Warning').t`Invalid alias prefix`;
    }

    if (aliasSuffix === undefined) {
        errors.aliasSuffix = c('Warning').t`Missing alias suffix`;
    }

    if (mailboxes.length === 0) {
        errors.mailboxes = c('Warning').t`You must select at least one mailbox`;
    }

    return errors;
};

export const validateNewAliasForm = (values: NewAliasFormValues): FormikErrors<NewAliasFormValues> => {
    const errors: FormikErrors<NewAliasFormValues> = { ...validateItemErrors(values), ...validateAliasForm(values) };
    const { aliasPrefix, aliasSuffix, mailboxes } = values;

    if (aliasPrefix === undefined || aliasPrefix.trim() === '') {
        errors.aliasPrefix = c('Warning').t`Missing alias prefix`;
    }

    if (aliasPrefix && !validateLocalPart(aliasPrefix + (aliasSuffix?.value?.split('@')?.[0] ?? ''))) {
        errors.aliasPrefix = c('Warning').t`Invalid alias prefix`;
    }

    if (aliasPrefix && !/^[a-z0-9\-\_.]*$/.test(aliasPrefix)) {
        errors.aliasPrefix = c('Warning').t`Only alphanumeric characters, dots, hyphens and underscores are allowed`;
    }

    if (aliasPrefix && aliasPrefix.length > 40) {
        errors.aliasPrefix = c('Warning').t`The alias prefix cannot be longer than 40 characters`;
    }

    if (aliasSuffix === undefined) {
        errors.aliasSuffix = c('Warning').t`Missing alias suffix`;
    }

    if (mailboxes.length === 0) {
        errors.mailboxes = c('Warning').t`You must select at least one mailbox`;
    }

    return errors;
};

export const validateEditAliasForm = (values: EditAliasFormValues): FormikErrors<EditAliasFormValues> => {
    const errors: FormikErrors<EditAliasFormValues> = validateItemErrors(values);

    if (values.mailboxes.length === 0) {
        errors.mailboxes = c('Warning').t`You must select at least one mailbox`;
    }

    return errors;
};
