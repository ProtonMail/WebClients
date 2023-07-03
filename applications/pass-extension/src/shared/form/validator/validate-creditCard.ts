import type { FormikErrors } from 'formik';

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
    return { ...errors };
};
