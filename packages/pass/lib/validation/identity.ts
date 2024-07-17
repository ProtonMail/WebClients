import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateItemErrors } from '@proton/pass/lib/validation/item';
import type { ExtraField, NewIdentityItemFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

const validateExtraFields = (values: NewIdentityItemFormValues): FormikErrors => {
    const extraFields: (keyof Pick<
        NewIdentityItemFormValues,
        'extraPersonalDetails' | 'extraAddressDetails' | 'extraContactDetails' | 'extraWorkDetails'
    >)[] = ['extraPersonalDetails', 'extraAddressDetails', 'extraContactDetails', 'extraWorkDetails'];

    const errors = extraFields.reduce<FormikErrors<NewIdentityItemFormValues>>((acc, key) => {
        const fieldErrors = values[key].map(({ fieldName }) => {
            const fieldError: FormikErrors<ExtraField> = {};

            if (isEmptyString(fieldName)) fieldError.fieldName = c('Validation').t`Field name is required`;

            return fieldError;
        });

        if (fieldErrors.some((error) => Object.keys(error).length > 0)) {
            acc[key] = fieldErrors;
        }

        return acc;
    }, {});

    return Object.keys(errors).length > 0 ? (errors as FormikErrors<NewIdentityItemFormValues>) : undefined;
};

const validateExtraSections = ({ extraSections }: NewIdentityItemFormValues): FormikErrors => {
    const errors = extraSections.reduce<FormikErrors<NewIdentityItemFormValues>>(
        (acc, { sectionFields }) => {
            const fieldErrors = sectionFields.map(({ fieldName }) => {
                const fieldError: FormikErrors<ExtraField> = {};

                if (isEmptyString(fieldName)) fieldError.fieldName = c('Validation').t`Field name is required`;

                return fieldError;
            });

            if (fieldErrors.some((error) => Object.keys(error).length > 0)) {
                acc.extraSections.push({ sectionFields: fieldErrors });
            }

            return acc;
        },
        { extraSections: [] }
    );

    return errors.extraSections.length > 0 ? (errors as FormikErrors<NewIdentityItemFormValues>) : undefined;
};

export const validateIdentityForm = (values: NewIdentityItemFormValues): FormikErrors<NewIdentityItemFormValues> => {
    const errors: FormikErrors<NewIdentityItemFormValues> = validateItemErrors(values);

    const extraFieldsErrors = validateExtraFields(values);
    const extraSectionsErrors = validateExtraSections(values);

    return { ...errors, ...extraFieldsErrors, ...extraSectionsErrors };
};
