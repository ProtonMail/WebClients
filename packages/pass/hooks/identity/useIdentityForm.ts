import { type ComponentType, useMemo, useState } from 'react';

import type { FactoryOpts } from 'imask/masked/factory';

import type { ExtractKeysOfType, IdentityValues, UnsafeItemExtraField } from '@proton/pass/types';
import { arrayRemove } from '@proton/pass/utils/array/remove';
import { prop } from '@proton/pass/utils/fp/lens';

import { getIdentityFields, getInitialSections } from './utils';

export type IdentityFieldName = ExtractKeysOfType<IdentityValues, string>;
export type IdentityExtraFieldsKey = ExtractKeysOfType<IdentityValues, UnsafeItemExtraField[]>;

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

const buildFormSections = (values: IdentityValues, editing: boolean): IdentityFormSection[] => {
    const fields = getIdentityFields();
    const formSections = getInitialSections(fields);

    return formSections.map<IdentityFormSection>((section) => {
        const { optionalFields = [] } = section;
        const filteredOptionalFields = optionalFields.filter((field) => values[field.name]);
        const fields = [...section.fields, ...filteredOptionalFields];
        const currentFieldNames = new Set(fields.map(prop('name')));

        return {
            ...section,
            fields,
            optionalFields: optionalFields.filter((field) => !currentFieldNames.has(field.name)),
            expanded: editing
                ? fields.some((field) => values[field.name]?.length ?? values[field.name])
                : section.expanded,
        };
    });
};

export const useIdentityForm = (values: IdentityValues, editing: boolean = false) => {
    const [sections, setSections] = useState<IdentityFormSection[]>(buildFormSections(values, editing));

    const addOptionalField = (sectionIndex: number, fieldName: string) =>
        setSections((prevSections) =>
            prevSections.map((section, idx) => {
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
            })
        );

    return useMemo(() => ({ sections, addOptionalField }), [sections]);
};
