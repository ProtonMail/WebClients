import { type ComponentType, useMemo, useState } from 'react';

import type { FactoryOpts } from 'imask/masked/factory';

import type { IdentityExtraFieldsKey, IdentityFieldName, IdentityValues } from '@proton/pass/types';
import { arrayRemove } from '@proton/pass/utils/array/remove';
import { prop } from '@proton/pass/utils/fp/lens';

import { getIdentityFields, getInitialSections } from './utils';

export type IdentityFormField = {
    name: IdentityFieldName;
    component?: ComponentType<any>;
    label: string;
    mask?: FactoryOpts;
    placeholder: string;
};

export type IdentityFormSection = {
    customFieldsKey?: IdentityExtraFieldsKey;
    expanded: boolean;
    fields: IdentityFormField[];
    name: string;
    optionalFields?: IdentityFormField[];
};

export const buildFormSections = (values: IdentityValues, editing: boolean): IdentityFormSection[] => {
    const fields = getIdentityFields();
    const formSections = getInitialSections(fields);

    return formSections.map<IdentityFormSection>((section) => {
        const filteredOptionalFields = section.optionalFields?.filter((field) => values[field.name]);
        const fields = [...section.fields, ...(filteredOptionalFields ?? [])];
        const currentFieldNames = new Set(fields.map(prop('name')));
        const customFields = section.customFieldsKey ? values[section.customFieldsKey] : [];
        const optionalFields = section.optionalFields?.filter((field) => !currentFieldNames.has(field.name));
        const expanded = editing
            ? fields.some((field) => values[field.name]) || customFields.length > 0
            : section.expanded;

        return { ...section, fields, optionalFields, expanded };
    });
};

export const addFormSectionOptionalField =
    (sectionIndex: number, fieldName: IdentityFieldName) => (sections: IdentityFormSection[]) =>
        sections.map((section, idx) => {
            if (idx !== sectionIndex) return section;
            else {
                const { optionalFields = [] } = section;
                const optionalIdx = optionalFields.findIndex(({ name }) => name === fieldName);
                if (optionalIdx === -1) return section;

                return {
                    ...section,
                    fields: [...section.fields, { ...optionalFields[optionalIdx] }],
                    optionalFields: arrayRemove(optionalFields, optionalIdx),
                };
            }
        });

export const useIdentityForm = (values: IdentityValues, editing: boolean = false) => {
    const [sections, setSections] = useState<IdentityFormSection[]>(() => buildFormSections(values, editing));

    return useMemo(
        () => ({
            sections,
            addOptionalField: (sectionIndex: number, fieldName: IdentityFieldName) =>
                setSections(addFormSectionOptionalField(sectionIndex, fieldName)),
        }),
        [sections]
    );
};
