import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateItemErrors } from './item';

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

const isExpirationDateValid = (expirationDate: string) => {
    if (expirationDate.length === 4) {
        const month = parseInt(expirationDate.slice(0, 2));
        const year = parseInt(expirationDate.slice(-2));
        return !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year >= 0 && year <= 99;
    }
    if (expirationDate.length === 6) {
        const month = parseInt(expirationDate.slice(0, 2));
        const year = parseInt(expirationDate.slice(-4));
        return !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year >= 0 && year <= 9999;
    }
    return false;
};

export const validateCreditCardForm = (values: CreditCardItemFormValues): FormikErrors<CreditCardItemFormValues> => {
    const errors: FormikErrors<CreditCardItemFormValues> = validateItemErrors(values);

    if (values.expirationDate.length && !isExpirationDateValid(values.expirationDate)) {
        errors.expirationDate = c('Warning').t`Expiration Date is not in the format MM/YY`;
    }

    return { ...errors };
};

export const expirationDateMMYY = (expirationDate: string) => {
    if (!expirationDate) return '';
    if (!isExpirationDateValid(expirationDate)) {
        throw new Error('Invalid card expiration date');
    }
    if (expirationDate.length === 4) return expirationDate;

    const month = expirationDate.slice(0, 2);
    const year = expirationDate.slice(-2);

    return `${month}${year}`;
};

export const expirationDateMMYYYY = (expirationDate: string) => {
    if (!expirationDate) return '';
    if (!isExpirationDateValid(expirationDate)) {
        throw new Error('Invalid card expiration date');
    }
    if (expirationDate.length === 6) return expirationDate;

    const currentYear = new Date().getFullYear().toString();
    const month = expirationDate.slice(0, 2);
    const year = expirationDate.slice(-2);

    return `${month}${currentYear.slice(0, 2)}${year}`;
};
