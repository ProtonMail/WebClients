import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import { isEmptyString } from '@proton/pass/utils/string';

import { validateUrl, validateUrls } from '../../../popup/components/Field/UrlGroupField';
import type { LoginItemFormValues } from '../types';
import { validateAliasForm } from './validate-alias';
import { validateExtraFields } from './validate-extrafield';
import { validateItemErrors } from './validate-item';

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
