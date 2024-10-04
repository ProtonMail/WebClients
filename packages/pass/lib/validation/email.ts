import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export type EmailFormValues = { email: string };

export const validateEmailForm = ({ email }: EmailFormValues): FormikErrors<EmailFormValues> => {
    const errors: FormikErrors<EmailFormValues> = {};
    if (!email) errors.email = c('Warning').t`Email cannot be empty`;
    else if (!validateEmailAddress(email)) errors.email = c('Warning').t`Invalid email`;
    return errors;
};
