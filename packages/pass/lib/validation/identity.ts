import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateItemErrors } from '@proton/pass/lib/validation/item';
import type { DeobfuscatedItemExtraField, IdentityItemFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import type { ExtraFieldErrors } from './extra-field';

const EXTRA_FIELD_KEYS = [
    'extraPersonalDetails',
    'extraAddressDetails',
    'extraContactDetails',
    'extraWorkDetails',
] as const;

const validateExtraField = ({ fieldName }: DeobfuscatedItemExtraField): ExtraFieldErrors => {
    const errors: ExtraFieldErrors = {};
    if (isEmptyString(fieldName)) errors.fieldName = c('Validation').t`Field name is required`;
    return errors;
};

const validateExtraFields = (values: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => {
    const errors = EXTRA_FIELD_KEYS.reduce<FormikErrors<IdentityItemFormValues>>((acc, key) => {
        const fieldErrors = values[key].map(validateExtraField);
        if (fieldErrors.some((err) => Object.keys(err).length)) acc[key] = fieldErrors;
        return acc;
    }, {});

    return Object.keys(errors).length ? errors : {};
};

/** Formik union error type narrowing */
export type ExtraSectionsError = { sectionFields?: ExtraFieldErrors[] };

const validateExtraSections = ({ extraSections }: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => {
    const errors = extraSections.reduce<ExtraSectionsError[]>((acc, { sectionFields }, index) => {
        const sectionErrors: ExtraSectionsError = {};
        const fieldErrors = sectionFields.map(validateExtraField);
        if (fieldErrors.some((error) => Object.keys(error).length)) sectionErrors.sectionFields = fieldErrors;
        if (Object.keys(sectionErrors).length) acc[index] = sectionErrors;

        return acc;
    }, []);

    return errors.length > 0 ? { extraSections: errors } : {};
};

export const validateIdentityForm = (values: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => ({
    ...validateItemErrors(values),
    ...validateExtraFields(values),
    ...validateExtraSections(values),
});
