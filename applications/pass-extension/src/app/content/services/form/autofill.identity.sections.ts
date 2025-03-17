import type { FieldHandle } from 'proton-pass-extension/app/content/types';

import { FieldType, IdentityFieldType, getIdentityFieldType } from '@proton/pass/fathom';

type IdentitySection = { types: Set<IdentityFieldType>; fields: { field: FieldHandle; type: IdentityFieldType }[] };

/** Critical types are those that should not have duplicates within the same section.
 * This includes ADDRESS, FIRSTNAME, and FULLNAME, as these typically represent
 * distinct entities or individuals when they appear multiple times in a form. */
const isCriticalType = (type: IdentityFieldType): boolean =>
    type === IdentityFieldType.ADDRESS || type === IdentityFieldType.FIRSTNAME || type === IdentityFieldType.FULLNAME;

/** Resolves a list of form fields into logically grouped identity sections.
 * Creates a new section when a critical field type (ADDRESS, FIRSTNAME, FULLNAME)
 * is encountered and already exists in the current section, but not consecutively */
export const resolveIdentitySections = (fields: FieldHandle[]): IdentitySection[] =>
    fields.reduce<IdentitySection[]>((sections, field: FieldHandle) => {
        const { fieldType } = field;
        const identityField = fieldType === FieldType.IDENTITY;
        const emailField = fieldType === FieldType.EMAIL;

        if (!(identityField || emailField)) return sections;

        const type = emailField ? IdentityFieldType.EMAIL : (field.identityType ?? getIdentityFieldType(field.element));
        if (type === undefined) return sections;

        const current = sections[sections.length - 1];
        const newField = { field, type };

        if (sections.length === 0) return [{ types: new Set([type]), fields: [newField] }];

        const lastFieldType = current.fields[current.fields.length - 1]?.type;
        const addNewSection = isCriticalType(type) && current.types.has(type) && type !== lastFieldType;

        if (addNewSection) return [...sections, { types: new Set([type]), fields: [newField] }];
        else {
            current.types.add(type);
            current.fields.push(newField);
            return sections;
        }
    }, []);
