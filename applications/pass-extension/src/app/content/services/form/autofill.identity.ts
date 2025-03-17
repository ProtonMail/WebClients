import type { FieldHandle } from 'proton-pass-extension/app/content/types';

import { FieldType, IdentityFieldType } from '@proton/pass/fathom';
import type { ItemContent, Maybe } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { oneOf, truthy } from '@proton/pass/utils/fp/predicates';
import lastItem from '@proton/utils/lastItem';

export interface IdentityFieldConfig {
    getValue: (data: ItemContent<'identity'>) => Maybe<string>;
    subFields?: IdentityFieldType[];
}

const sanitizeName = (value?: string) => value?.trim().replace(/\s+/g, ' ');
const splitFullName = ({ fullName }: ItemContent<'identity'>) => fullName.split(' ').filter(truthy);

/** Use `fullName` if available, otherwise derive from components */
export const getFullName = pipe((data: ItemContent<'identity'>): Maybe<string> => {
    if (data.fullName) return data.fullName;
    const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ').trim();
    return fullName.length ? fullName : undefined;
}, sanitizeName);

/** Use `firstName` if available, otherwise derive from `fullName` */
export const getFirstName = pipe((data: ItemContent<'identity'>): Maybe<string> => {
    if (data.firstName) return data.firstName.trim();
    return splitFullName(data)[0];
}, sanitizeName);

/** Use `middleName` if available, otherwise derive from `fullName` */
export const getMiddleName = pipe((data: ItemContent<'identity'>): Maybe<string> => {
    if (data.middleName) return data.middleName.trim();
    const parts = splitFullName(data);
    return parts.length > 2 ? parts.slice(1, parts.length - 1).join(' ') : undefined;
}, sanitizeName);

/** Use `lastName` if available, otherwise derive from `fullName` */
export const getLastName = pipe((data: ItemContent<'identity'>): Maybe<string> => {
    if (data.lastName) return data.lastName.trim();
    const parts = splitFullName(data);
    return parts.length > 1 ? lastItem(parts) : undefined;
}, sanitizeName);

export const IDENTITY_FIELDS_CONFIG: Record<IdentityFieldType, (data: ItemContent<'identity'>) => Maybe<string>> = {
    [IdentityFieldType.FULLNAME]: getFullName,
    [IdentityFieldType.FIRSTNAME]: getFirstName,
    [IdentityFieldType.MIDDLENAME]: getMiddleName,
    [IdentityFieldType.LASTNAME]: getLastName,
    [IdentityFieldType.TELEPHONE]: prop('phoneNumber'),
    [IdentityFieldType.ORGANIZATION]: prop('organization'),
    [IdentityFieldType.ADDRESS]: prop('streetAddress'),
    [IdentityFieldType.CITY]: prop('city'),
    [IdentityFieldType.STATE]: prop('stateOrProvince'),
    [IdentityFieldType.ZIPCODE]: prop('zipOrPostalCode'),
    [IdentityFieldType.COUNTRY]: prop('countryOrRegion'),
    [IdentityFieldType.EMAIL]: prop('email'),
};

/** Autofills identity fields with data while preventing duplicates within a section.
 * Iterates through form fields in a specific order, starting from the selected field
 * and wrapping around. It autofills fields with corresponding identity data, keeping
 * track of previously filled field types to avoid duplicates within the same section.
 * This approach is particularly useful for forms with multiple sections that may require
 * different sets of information (e.g., separate billing and shipping addresses). */
export const autofillIdentityFields = (
    fields: FieldHandle[],
    selectedField: FieldHandle,
    data: ItemContent<'identity'>
) => {
    const autofilled = new Set<IdentityFieldType>();
    const sectionFields = fields.filter((field) => field.sectionIndex === selectedField.sectionIndex);
    const selectedFieldIndex = sectionFields.findIndex((field) => field === selectedField);

    const reorderedFields =
        selectedFieldIndex !== -1
            ? [...sectionFields.slice(selectedFieldIndex), ...sectionFields.slice(0, selectedFieldIndex)]
            : sectionFields;

    reorderedFields.forEach((field, idx) => {
        const { identityType } = field;
        const shouldAutofill = oneOf(null, FieldType.IDENTITY)(field.autofilled);

        /** Autofill only for valid identity fields not yet filled in this sequence
         * and not autofilled by another field type (ie: email via alias suggestion). */
        if (!identityType || autofilled.has(identityType) || !shouldAutofill) return;

        const getValue = IDENTITY_FIELDS_CONFIG[identityType];
        const value = getValue(data);

        /** Use setTimeout to stagger autofill operations across multiple frames.
         * This helps avoid potential blocking by browsers or websites that may
         * detect and prevent rapid, simultaneous field autofill. The delay increases
         * for each field, mimicking human-like interaction */
        if (value) setTimeout(() => field.autofill(value, { type: FieldType.IDENTITY }), idx);
        autofilled.add(identityType);
    });
};
