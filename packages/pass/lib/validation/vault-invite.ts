import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import type { InviteFormValues } from '@proton/pass/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export const validateShareInviteValues = (values: InviteFormValues) => {
    if (values.step === 'vault' && values.withVaultCreation) return validateVaultValues(values);

    let errors: FormikErrors<InviteFormValues> = {};

    if (!validateEmailAddress(values.email)) {
        errors.email = c('Warning').t`Please enter a valid email address`;
    }

    return errors;
};
