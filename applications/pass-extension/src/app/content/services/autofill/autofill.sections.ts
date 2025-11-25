import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { isCCField, isEmailField, isIdentityField } from 'proton-pass-extension/lib/utils/field';

import { CCFieldType, FieldType, IdentityFieldType } from '@proton/pass/fathom/labels';
import { isInputElement } from '@proton/pass/utils/dom/predicates';

export type FieldSubType = IdentityFieldType | CCFieldType;
type FieldSection = {
    subTypes: Set<FieldSubType>;
    fields: FieldHandle[];
    type: FieldType.IDENTITY | FieldType.CREDIT_CARD;
};

/** Critical types are those that should not have duplicates within the same section.
 * This includes ADDRESS, FIRSTNAME, and FULLNAME, as these typically represent
 * distinct entities or individuals when they appear multiple times in a form. */
const isCriticalType = (type: FieldSubType): boolean =>
    type === CCFieldType.NUMBER ||
    type === IdentityFieldType.ADDRESS ||
    type === IdentityFieldType.FIRSTNAME ||
    type === IdentityFieldType.FULLNAME;

/** Resolves a list of form fields into logically grouped identity sections.
 * Creates a new section when a critical field type (ADDRESS, FIRSTNAME, FULLNAME)
 * is encountered and already exists in the current section, but not consecutively */
export const resolveFieldSections = (fields: FieldHandle[]) =>
    fields.reduce<FieldSection[]>((sections, field: FieldHandle) => {
        const element = field.element;
        const isInput = isInputElement(element);

        const email = isEmailField(field);
        const identity = isIdentityField(field);
        const cc = isCCField(field);
        const isSectionField = (identity && isInput) || cc || (email && isInput);

        if (!isSectionField) return sections;

        const type = email || identity ? FieldType.IDENTITY : FieldType.CREDIT_CARD;
        const subType = email ? IdentityFieldType.EMAIL : field.fieldSubType;
        if (subType === undefined) return sections;

        if (sections.length === 0) {
            field.sectionIndex = 0;
            return [{ subTypes: new Set([subType]), fields: [field], type }];
        }

        const sectionIdx = sections.length - 1;
        const current = sections[sectionIdx];
        const lastFieldType = current.fields[current.fields.length - 1]?.fieldSubType;
        const sectionSplit = current.type !== type;
        const fieldSplit = isCriticalType(subType) && current.subTypes.has(subType);
        const addNewSection = sectionSplit || (fieldSplit && (cc || subType !== lastFieldType));

        if (addNewSection) {
            field.sectionIndex = sectionIdx + 1;
            return [...sections, { subTypes: new Set([subType]), fields: [field], type }];
        } else {
            field.sectionIndex = sectionIdx;
            current.subTypes.add(subType);
            current.fields.push(field);
            return sections;
        }
    }, []);
