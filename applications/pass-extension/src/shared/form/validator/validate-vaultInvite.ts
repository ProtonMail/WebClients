import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import type { InviteFormValues } from '../types';

export const validateShareInviteValues = ({ email }: InviteFormValues) => {
    let errors: FormikErrors<InviteFormValues> = {};
    if (!validateEmailAddress(email)) {
        errors.email = c('Warning').t`Please enter a valid email address`;
    }

    return errors;
};
