import type { FormikErrors } from 'formik';

import type { ExtraSectionsError } from '@proton/pass/lib/validation/custom-item';
import { validateCustomSectionName } from '@proton/pass/lib/validation/custom-item';
import { validateItemErrors } from '@proton/pass/lib/validation/item';
import type { IdentityItemFormValues } from '@proton/pass/types';

import { validateExtraFieldName } from './extra-field';

const EXTRA_SECTION_KEYS = [
    'extraPersonalDetails',
    'extraAddressDetails',
    'extraContactDetails',
    'extraWorkDetails',
] as const;

const validateExtraSectionFields = (values: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => {
    const errors = EXTRA_SECTION_KEYS.reduce<FormikErrors<IdentityItemFormValues>>((acc, key) => {
        const fieldErrors = values[key].map(validateExtraFieldName);
        if (fieldErrors.some((err) => Object.keys(err).length)) acc[key] = fieldErrors;
        return acc;
    }, {});

    return Object.keys(errors).length ? errors : {};
};

const validateExtraSections = ({ extraSections }: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => {
    const errors = extraSections.reduce<ExtraSectionsError[]>((acc, section, index) => {
        const sectionErrors: ExtraSectionsError = validateCustomSectionName(section);

        const fieldErrors = section.sectionFields.map(validateExtraFieldName);
        if (fieldErrors.some((error) => Object.keys(error).length)) sectionErrors.sectionFields = fieldErrors;
        if (Object.keys(sectionErrors).length) acc[index] = sectionErrors;

        return acc;
    }, []);

    return errors.length > 0 ? { extraSections: errors } : {};
};

export const validateIdentityForm = (values: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => ({
    ...validateItemErrors(values),
    ...validateExtraSectionFields(values),
    ...validateExtraSections(values),
});
