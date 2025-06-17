import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { CustomItemFormValues, ItemSectionFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import { validateExtraFields } from './extra-field';
import { validateItemErrors } from './item';

export const validateCustomItemForm = (values: CustomItemFormValues): FormikErrors<CustomItemFormValues> => {
    return {
        ...validateItemErrors(values),
        ...validateExtraFields(values),
    };
};

export const validateItemSection = ({ sectionName }: ItemSectionFormValues): FormikErrors<ItemSectionFormValues> => {
    const errors: FormikErrors<ItemSectionFormValues> = {};
    if (isEmptyString(sectionName)) errors.sectionName = c('Validation').t`Section name cannot be empty`;
    return errors;
};
