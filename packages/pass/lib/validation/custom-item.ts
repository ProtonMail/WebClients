import type { FormikErrors } from 'formik';

import type { CustomItemFormValues } from '@proton/pass/types';

import { validateExtraFields } from './extra-field';
import { validateItemErrors } from './item';

export const validateCustomItemForm = (values: CustomItemFormValues): FormikErrors<CustomItemFormValues> => {
    return {
        ...validateItemErrors(values),
        ...validateExtraFields(values),
    };
};
