import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { PasswordCredentials } from '@proton/pass/lib/auth/password';
import type { Maybe } from '@proton/pass/types';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const validatePassword =
    (errorMessage: string) =>
    (values: PasswordCredentials): FormikErrors<PasswordCredentials> =>
        values.password.length > 0 ? {} : { password: errorMessage };

export const validateCurrentPassword = validatePassword(c('Warning').t`${BRAND_NAME} password is required`);
export const validateExtraPassword = validatePassword(c('Warning').t`Extra password is required`);

export const validateNewExtraPassword = (password: string, previous?: string): Maybe<string> => {
    if (password.length === 0) return c('Warning').t`Extra password cannot be empty`;
    if (!previous && password.length < 8) return c('Warning').t`Extra password should have at least 8 characters`;
    if (previous && password !== previous) return c('Warning').t`Passwords do not match`;
};
