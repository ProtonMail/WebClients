import { useMemo } from 'react';

import type { DeobfuscatedItemExtraField, IdentityValues } from '@proton/pass/types';

import type { IdentityFormField } from './useIdentityForm';
import { getIdentityFields, getInitialSections } from './utils';

type IdentitySectionContent = { name: string; fields: IdentitySectionField[] };
type IdentitySectionField = Omit<IdentityFormField, 'name' | 'placeholder'> & { value: string; hidden?: boolean };

const presentExtraField = (field: DeobfuscatedItemExtraField): IdentitySectionField => ({
    label: field.fieldName,
    value: (() => {
        switch (field.type) {
            case 'hidden':
            case 'text':
                return field.data.content;
            case 'totp':
                return field.data.totpUri;
            case 'timestamp':
                return field.data.timestamp;
        }
    })(),
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
