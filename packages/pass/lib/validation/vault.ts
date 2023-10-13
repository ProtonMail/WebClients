import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import type { VaultFormValues } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp';
import { isEmptyString } from '@proton/pass/utils/string';

export const validateVaultValues = ({ name }: VaultFormValues) => {
    let errors: FormikErrors<VaultFormValues> = {};
    if (isEmptyString(name)) {
        errors.name = c('Warning').t`Vault name is required`;
    }

    return errors;
};

export const validateVaultVaultsWithEffect = (effect: (errors: FormikErrors<VaultFormValues>) => void) =>
    pipe(validateVaultValues, tap(effect));
