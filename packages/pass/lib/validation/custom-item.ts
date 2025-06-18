import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { CustomItemFormValues, ItemSectionFormValues } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import type { ExtraFieldErrors } from './extra-field';
import { validateExtraFieldName } from './extra-field';
import { validateItemErrors } from './item';

export type ExtraSectionsError = { sectionFields?: ExtraFieldErrors[]; sectionName?: string };

export const validateCustomSectionName = ({
    sectionName,
}: ItemSectionFormValues): FormikErrors<ItemSectionFormValues> => {
    const errors: FormikErrors<ItemSectionFormValues> = {};
    if (isEmptyString(sectionName)) errors.sectionName = c('Validation').t`Section name cannot be empty`;
    return errors;
};

const validateCustomSections = ({ sections }: CustomItemFormValues): FormikErrors<CustomItemFormValues> => {
    const errors = sections.reduce<ExtraSectionsError[]>((acc, section, index) => {
        const sectionErrors: ExtraSectionsError = validateCustomSectionName(section);
        const fieldErrors = section.sectionFields.map(validateExtraFieldName);
        if (fieldErrors.some((error) => Object.keys(error).length)) sectionErrors.sectionFields = fieldErrors;
        if (Object.keys(sectionErrors).length) acc[index] = sectionErrors;

        return acc;
    }, []);

    return errors.length > 0 ? { sections: errors } : {};
};

export const validateCustomItemForm = (values: CustomItemFormValues): FormikErrors<CustomItemFormValues> => {
    return {
        ...validateItemErrors(values),
        ...validateCustomSections(values),
    };
};
