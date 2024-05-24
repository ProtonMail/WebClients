import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import type { LoginItemFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import { validateAliasForm } from './alias';
import { validateExtraFields } from './extra-field';
import { validateItemErrors } from './item';
import { validateUrl, validateUrls } from './url';

const validateTotpUri = (values: LoginItemFormValues) => {
    if (values.totpUri) {
        const normalized = parseOTPValue(values.totpUri);
        if (!normalized) return { totpUri: c('Validation').t`OTP secret or URI is invalid` };

        return {};
    }
};

// TODO: migrate to use Rust's email validation
const validateEmail = (email: string) => {
    if (!isEmptyString(email) && !validateEmailAddress(email)) {
        return { itemEmail: c('Validation').t`Email address is invalid` };
    }
    return {};
};

export const validateLoginForm = (values: LoginItemFormValues): FormikErrors<LoginItemFormValues> => {
    const errors: FormikErrors<LoginItemFormValues> = validateItemErrors(values);
    const urlError = validateUrl(values);
    const urlsErrors = validateUrls(values);
    const totpUriErrors = validateTotpUri(values);
    const aliasErrors = values.withAlias && validateAliasForm(values);
    const extraFieldsErrors = validateExtraFields(values);
    const itemUsernameErrors = validateEmail(values.itemEmail);

    return {
        ...errors,
        ...urlError,
        ...urlsErrors,
        ...totpUriErrors,
        ...aliasErrors,
        ...extraFieldsErrors,
        ...itemUsernameErrors,
    };
};
