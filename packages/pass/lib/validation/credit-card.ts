import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { CreditCardItemFormValues } from '@proton/pass/types';
import { isValidExpirationDate } from '@proton/pass/utils/time/expiration-date';

import { validateItemErrors } from './item';

export const validateCreditCardForm = (values: CreditCardItemFormValues): FormikErrors<CreditCardItemFormValues> => {
    const errors: FormikErrors<CreditCardItemFormValues> = validateItemErrors(values);

    if (values.expirationDate.length && !isValidExpirationDate(values.expirationDate)) {
        errors.expirationDate = c('Warning').t`Expiration Date is not in the format MM/YY`;
    }

    return { ...errors };
};
