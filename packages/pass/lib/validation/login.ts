import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import type { LoginItemFormValues } from '@proton/pass/types';

import { validateAliasForm } from './alias';
import { validateItemErrors } from './item';
import { validateUrl, validateUrls } from './url';

const validateTotpUri = (values: LoginItemFormValues) => {
    if (values.totpUri) {
        const normalized = parseOTPValue(values.totpUri);
        if (!normalized) return { totpUri: c('Validation').t`OTP secret or URI is invalid` };

        return {};
    }
};

type ValidateLoginForm = {
    values: LoginItemFormValues;
    shouldValidateEmail?: boolean;
};

export const validateLoginForm = async ({ values }: ValidateLoginForm): Promise<FormikErrors<LoginItemFormValues>> => {
    const errors: FormikErrors<LoginItemFormValues> = validateItemErrors(values);
    const urlError = validateUrl(values);
    const urlsErrors = validateUrls(values);
    const totpUriErrors = validateTotpUri(values);
    const aliasErrors = values.withAlias && (await validateAliasForm(values));

    return {
        ...errors,
        ...urlError,
        ...urlsErrors,
        ...totpUriErrors,
        ...aliasErrors,
    };
};
