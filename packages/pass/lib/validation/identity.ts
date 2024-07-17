import type { FormikErrors } from 'formik';

import { validateItemErrors } from '@proton/pass/lib/validation/item';
import type { ExtraField, NewIdentityItemFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateExtraCustomFields = (values: NewIdentityItemFormValues) => {
    const extraFields: (keyof Pick<
        NewIdentityItemFormValues,
        'extraPersonalDetails' | 'extraAddressDetails' | 'extraContactDetails' | 'extraWorkDetails'
    >)[] = ['extraPersonalDetails', 'extraAddressDetails', 'extraContactDetails', 'extraWorkDetails'];

    const errors = extraFields.reduce((acc, key) => {
        const fieldErrors = values[key].map((field) => {
            const fieldError: FormikErrors<ExtraField> = {};

            if (isEmptyString(field.fieldName)) {
                fieldError.fieldName = 'Field name is required';
            }

            return fieldError;
        });

        if (fieldErrors.some((error) => Object.keys(error).length > 0)) {
            acc[key] = fieldErrors;
        }

        return acc;
    }, {} as FormikErrors<NewIdentityItemFormValues>);

    return Object.keys(errors).length > 0 ? (errors as FormikErrors<NewIdentityItemFormValues>) : undefined;
};

export const validateIdentityForm = (values: NewIdentityItemFormValues): FormikErrors<NewIdentityItemFormValues> => {
    const errors: FormikErrors<NewIdentityItemFormValues> = validateItemErrors(values);

    const extraFieldsErrors = validateExtraCustomFields(values);

    return { ...errors, ...extraFieldsErrors };
};
