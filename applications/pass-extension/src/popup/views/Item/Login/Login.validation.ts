import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors } from 'formik';
import { c } from 'ttag';

import { selectAliasByAliasEmail } from '@proton/pass/store';
import { merge } from '@proton/pass/utils/object';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isEmptyString } from '@proton/pass/utils/string';

import { validateExtraFields } from '../../../components/Field/ExtraFieldGroup/ExtraField.validation';
import type { ExtraFieldGroupValues } from '../../../components/Field/ExtraFieldGroup/ExtraFieldGroup';
import { type UrlGroupValues, validateUrl, validateUrls } from '../../../components/Field/UrlGroupField';
import { type AliasFormValues, validateAliasForm } from '../Alias/Alias.validation';
import { validateItemErrors } from '../Item/Item.validation';

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

const validateTotpUri = (values: LoginItemFormValues) => {
    if (!isEmptyString(values.totpUri)) {
        const normalized = parseOTPValue(values.totpUri);
        if (!normalized) {
            return { totpUri: c('Validation').t`OTP Secret or URI is invalid` };
        }
        return {};
    }
};

export const validateLoginForm = (values: LoginItemFormValues): FormikErrors<LoginItemFormValues> => {
    const errors: FormikErrors<LoginItemFormValues> = validateItemErrors(values);
    const urlError = validateUrl(values);
    const urlsErrors = validateUrls(values);
    const totpUriErrors = validateTotpUri(values);
    const aliasErrors = values.withAlias && validateAliasForm(values);
    const extraFieldsErrors = validateExtraFields(values);

    return {
        ...errors,
        ...urlError,
        ...urlsErrors,
        ...totpUriErrors,
        ...aliasErrors,
        ...extraFieldsErrors,
    };
};

export const useLoginItemAliasModal = <T extends LoginItemFormValues>(form: FormikContextType<T>) => {
    const [aliasModalOpen, setAliasModalOpen] = useState(false);

    const { values } = form;
    const { withAlias, username, aliasPrefix } = values;

    const relatedAlias = useSelector(selectAliasByAliasEmail(username));
    const canCreateAlias = !relatedAlias && !withAlias;
    const willCreateAlias = !relatedAlias && withAlias && !isEmptyString(aliasPrefix);
    const usernameIsAlias = relatedAlias || willCreateAlias;

    useEffect(() => {
        if (relatedAlias) {
            form.setValues((values) =>
                merge(values, {
                    withAlias: false,
                    aliasPrefix: '',
                    aliasSuffix: undefined,
                    mailboxes: [],
                })
            );
        }
    }, [relatedAlias]);

    return { aliasModalOpen, relatedAlias, canCreateAlias, willCreateAlias, usernameIsAlias, setAliasModalOpen };
};
