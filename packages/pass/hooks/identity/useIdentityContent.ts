import { useMemo } from 'react';

import type { DeobfuscatedItemExtraField, IdentityValues } from '@proton/pass/types';

import type { IdentityFormField } from './useIdentityForm';
import { getIdentityFields, getInitialSections } from './utils';

type IdentitySectionContent = {
    name: string;
    fields: IdentitySectionField[];
    customFields: DeobfuscatedItemExtraField[];
};
type IdentitySectionField = Omit<IdentityFormField, 'name' | 'placeholder'> & { value: string; hidden?: boolean };

export const buildContentSections = (values: IdentityValues): IdentitySectionContent[] => {
    const fields = getIdentityFields();
    const formSections = getInitialSections(fields);

    return formSections
        .map<IdentitySectionContent>((section) => {
            const { optionalFields = [], customFieldsKey } = section;

            const fields: IdentitySectionField[] = section.fields
                .concat(optionalFields)
                .filter((field) => values[field.name])
                .map<IdentitySectionField>((field) => ({
                    ...field,
                    label: field.label,
                    value: values[field.name],
                }));

            return { name: section.name, fields, customFields: values[customFieldsKey] };
        })
        .filter((sections) => sections.fields.length + sections.customFields.length > 0)
        .concat(
            values.extraSections.map<IdentitySectionContent>(({ sectionFields, sectionName }) => ({
                name: sectionName,
                fields: [],
                customFields: sectionFields,
            }))
        );
};

export const useIdentityContent = (values: IdentityValues): IdentitySectionContent[] =>
    useMemo(() => buildContentSections(values), [values]);
