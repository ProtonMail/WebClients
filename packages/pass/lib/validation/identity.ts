import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateItemErrors } from '@proton/pass/lib/validation/item';
import type { IdentityItemFormValues, UnsafeItemExtraField } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

const validateExtraFields = (values: IdentityItemFormValues) => {
    const extraFields: (keyof Pick<
        IdentityItemFormValues,
        'extraPersonalDetails' | 'extraAddressDetails' | 'extraContactDetails' | 'extraWorkDetails'
    >)[] = ['extraPersonalDetails', 'extraAddressDetails', 'extraContactDetails', 'extraWorkDetails'];

    const errors = extraFields.reduce<FormikErrors<IdentityItemFormValues>>((acc, key) => {
        const fieldErrors = values[key].map(({ fieldName }) => {
            const fieldError: FormikErrors<UnsafeItemExtraField> = {};

            if (isEmptyString(fieldName)) fieldError.fieldName = c('Validation').t`Field name is required`;

            return fieldError;
        });

        if (fieldErrors.some((error) => Object.keys(error).length > 0)) {
            acc[key] = fieldErrors;
        }

        return acc;
    }, {});

    return Object.keys(errors).length > 0 ? (errors as FormikErrors<IdentityItemFormValues>) : undefined;
};

type ExtraSectionsErrors = FormikErrors<UnsafeItemExtraField>[];
const validateExtraSections = ({ extraSections }: IdentityItemFormValues) => {
    const errors = extraSections.reduce<ExtraSectionsErrors[]>((acc, { sectionFields }, index) => {
        const fieldErrors = sectionFields.map(({ fieldName }) => {
            const fieldError: FormikErrors<UnsafeItemExtraField> = {};

            if (isEmptyString(fieldName)) fieldError.fieldName = c('Validation').t`Field name is required`;

            return fieldError;
        });

        if (fieldErrors.some((error) => Object.keys(error).length > 0)) {
            acc[index] = fieldErrors;
        }

        return acc;
    }, []);

    return errors.length > 0 ? (errors as FormikErrors<IdentityItemFormValues>) : undefined;
};

export const validateIdentityForm = (values: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => {
    const errors: FormikErrors<IdentityItemFormValues> = validateItemErrors(values);

    const extraFieldsErrors = validateExtraFields(values);
    const extraSectionsErrors = validateExtraSections(values);

    return { ...errors, ...extraFieldsErrors, ...extraSectionsErrors };
};
