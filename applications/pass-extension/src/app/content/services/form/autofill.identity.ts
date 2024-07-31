import type { FieldHandle } from 'proton-pass-extension/app/content/types';

import { IdentityFieldType, getIdentityFieldType } from '@proton/pass/fathom';
import type { ItemContent, Maybe } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
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
};

/** Autofills identity fields with data while preventing duplicates.
 * Iterates through form fields and autofills them with corresponding
 * identity data. It keeps track of the previously autofilled field type
 * to avoid filling multiple fields with the same data. This is useful for
 * forms with multiple sections that may require different sets of information
 * IE: separate billing and shipping addresses */
export const autofillIdentityFields = (fields: FieldHandle[], data: ItemContent<'identity'>) => {
    let previous: IdentityFieldType;

    fields.forEach((field) => {
        const type = getIdentityFieldType(field.element);
        if (type === undefined || previous === type) return;

        const getValue = IDENTITY_FIELDS_CONFIG[type];
        const value = getValue(data);
        if (value) field.autofill(value);
        previous = type;
    });
};
