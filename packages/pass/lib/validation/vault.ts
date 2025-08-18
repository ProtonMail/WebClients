import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { VaultFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateVaultValues = ({ name }: VaultFormValues) => {
    const errors: FormikErrors<VaultFormValues> = {};
    if (isEmptyString(name)) {
        errors.name = c('Warning').t`Vault name is required`;
    }

    return errors;
};
