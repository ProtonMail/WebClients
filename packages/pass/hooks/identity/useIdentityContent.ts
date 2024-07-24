import { useMemo } from 'react';

import type { IdentityValues, UnsafeItemExtraField } from '@proton/pass/types';

import type { IdentityFormField } from './useIdentityForm';
import { getIdentityFields, getInitialSections } from './utils';

type IdentitySectionContent = { name: string; fields: IdentitySectionField[] };
type IdentitySectionField = Omit<IdentityFormField, 'name' | 'placeholder'> & { value: string; hidden?: boolean };

const presentExtraField = (field: UnsafeItemExtraField): IdentitySectionField => ({
    label: field.fieldName,
    value: field.type !== 'totp' ? field.data.content : '',
    hidden: field.type === 'hidden',
});

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

            const customFields = customFieldsKey ? values[customFieldsKey].map(presentExtraField) : [];

            return { name: section.name, fields: fields.concat(customFields) };
        })
        .filter((sections) => sections.fields.length)
        .concat(
            values.extraSections.map<IdentitySectionContent>(({ sectionFields, sectionName }) => ({
                name: sectionName,
                fields: sectionFields.map(presentExtraField),
            }))
        );
};

export const useIdentityContent = (values: IdentityValues): IdentitySectionContent[] =>
    useMemo(() => buildContentSections(values), [values]);
