import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateItemErrors } from './validate-item';

export type CreditCardItemFormValues = {
    shareId: string;
    name: string;
    cardholderName: string;
    number: string;
    expirationDate: string;
    verificationNumber: string;
    pin: string;
    note: string;
};

export const validateCreditCardForm = (values: CreditCardItemFormValues): FormikErrors<CreditCardItemFormValues> => {
    const errors: FormikErrors<CreditCardItemFormValues> = validateItemErrors(values);

    if (values.expirationDate.length && values.expirationDate.length < 6) {
        errors.expirationDate = c('Warning').t`Expiration Date is incomplete`;
    }

    return { ...errors };
};
