import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { InviteFormValues } from '@proton/pass/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export const validateShareInviteValues = ({ email }: InviteFormValues) => {
    let errors: FormikErrors<InviteFormValues> = {};
    if (!validateEmailAddress(email)) {
        errors.email = c('Warning').t`Please enter a valid email address`;
    }

    return errors;
};
