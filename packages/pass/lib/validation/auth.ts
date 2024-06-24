import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { PasswordCredentials } from '@proton/pass/lib/auth/password';
import type { Maybe } from '@proton/pass/types';

export const validateCurrentPassword = (values: PasswordCredentials): FormikErrors<PasswordCredentials> =>
    values.password.length > 0 ? {} : { password: c('Warning').t`Encryption password is required` };

export const validateNewExtraPassword = (password: string, previous?: string): Maybe<string> => {
    if (password.length === 0) return c('Warning').t`Extra password cannot be empty`;
    if (!previous && password.length < 8) return c('Warning').t`Extra password should have at least 8 characters`;
    if (previous && password !== previous) return c('Warning').t`Passwords do not match`;
};
