import type { FormikErrors } from 'formik';

import { validateItemErrors } from '../../../../shared/form/validator/validate-item';

export type CreditCardItemFormValues = {
    name: string;
    note: string;
};

export const validateCreditCardForm = (values: CreditCardItemFormValues): FormikErrors<CreditCardItemFormValues> => {
    const errors: FormikErrors<CreditCardItemFormValues> = validateItemErrors(values);

    return {
        ...errors,
    };
};
