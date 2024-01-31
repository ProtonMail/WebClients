import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import type { InviteFormValues } from '@proton/pass/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export const validateShareInviteValues = (values: InviteFormValues) => {
    if (values.step === 'vault' && values.withVaultCreation) return validateVaultValues(values);

    let errors: FormikErrors<InviteFormValues> = {};

    const emails = values.members.reduce<{ errors: string[]; pass: boolean }>(
        (acc, { value }) => {
            if (!validateEmailAddress(value.email)) {
                acc.pass = false;
                acc.errors.push(c('Validation').t`Invalid email`);
            } else acc.errors.push('');

            return acc;
        },
        { errors: [], pass: true }
    );

    if (!emails.pass) errors.members = emails.errors;

    return errors;
};
