import type { FieldHandle } from 'proton-pass-extension/app/content/types';

import { IdentityFieldType } from '@proton/pass/fathom';
import type { ItemContent, Maybe } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import lastItem from '@proton/utils/lastItem';

export interface IdentityFieldConfig {
    getValue: (data: ItemContent<'identity'>) => Maybe<string>;
    subFields?: IdentityFieldType[];
}

const IDENTITY_AUTOCOMPLETE_VALUES = Object.values(IdentityFieldType) as string[];

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

export const isIdentityAutocomplete = (autocomplete: string): autocomplete is IdentityFieldType =>
    IDENTITY_AUTOCOMPLETE_VALUES.includes(autocomplete);

export const IDENTITY_FIELDS_CONFIG: Record<IdentityFieldType, IdentityFieldConfig> = {
    [IdentityFieldType.NAME]: {
        getValue: getFullName,
        subFields: [
            IdentityFieldType.GIVEN_NAME /* first name */,
            IdentityFieldType.FAMILY_NAME /* last name */,
            IdentityFieldType.ADDITIONAL_NAME /* middle name */,
        ],
    },
    [IdentityFieldType.GIVEN_NAME]: { getValue: getFirstName },
    [IdentityFieldType.FAMILY_NAME]: { getValue: getLastName },
    [IdentityFieldType.ADDITIONAL_NAME]: { getValue: getMiddleName },
    [IdentityFieldType.TEL]: { getValue: prop('phoneNumber') },
    [IdentityFieldType.TEL_LOCAL]: { getValue: prop('phoneNumber') },
    [IdentityFieldType.TEL_NATIONAL]: { getValue: prop('phoneNumber') },
    [IdentityFieldType.ADDRESS]: {
        /* should not include the city name, postal code, or country
         * name as per the `autocomplete` attribute specification */
        getValue: prop('streetAddress'),
        subFields: [
            /** may vary depending on the country - as of now,
             * support only `ADDRESS_LINE1` as the address if
             * an item has a `streetAddress` value */
            IdentityFieldType.ADDRESS_LINE1,
        ],
    },
    [IdentityFieldType.ADDRESS_LINE1]: { getValue: prop('streetAddress') },
    [IdentityFieldType.ADDRESS_LEVEL1]: { getValue: prop('stateOrProvince') },
    [IdentityFieldType.ADDRESS_LEVEL2]: { getValue: prop('city') },
    [IdentityFieldType.POSTAL_CODE]: { getValue: prop('zipOrPostalCode') },
    [IdentityFieldType.ORGANIZATION]: { getValue: prop('organization') },
    [IdentityFieldType.COUNTRY]: { getValue: prop('countryOrRegion'), subFields: [IdentityFieldType.COUNTRY_NAME] },
    [IdentityFieldType.COUNTRY_NAME]: { getValue: prop('countryOrRegion') },
};

/** Identity autofill attempts to autofill subfields first. If no subfields
 * were autofilled, it then autofills the main field. This approach minimizes
 * incorrect autofills on forms with varying levels of field specificity. */
export const autofillIdentityFields = (fields: FieldHandle[], data: ItemContent<'identity'>) => {
    fields.forEach((field) => {
        const autocomplete = field.element.autocomplete;
        if (!isIdentityAutocomplete(autocomplete)) return;

        const config = IDENTITY_FIELDS_CONFIG[autocomplete];

        const subFieldAutofilled =
            config.subFields?.some((subType) => {
                const subField = fields.find((subField) => subField.element.autocomplete === subType);
                if (!subField) return false;

                const subConfig = IDENTITY_FIELDS_CONFIG[subType];
                const value = subConfig.getValue(data);
                if (!value) return false;

                subField.autofill(value);
                return true;
            }) ?? false;

        if (!subFieldAutofilled) {
            const value = config.getValue(data);
            if (value) field.autofill(value);
        }
    });
};
