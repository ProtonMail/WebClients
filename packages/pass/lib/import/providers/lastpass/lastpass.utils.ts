import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

import type { LastPassItem } from './lastpass.types';

const KEY_SEPARATOR = ':';

export const LASTPASS_EXPECTED_HEADERS: (keyof LastPassItem)[] = [
    'url',
    'username',
    'password',
    'extra',
    'name',
    'grouping',
    'fav',
];

const LAST_PASS_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
    'First Name': 'firstName',
    'Middle Name': 'middleName',
    'Last Name': 'lastName',
    Gender: 'gender',
    Birthday: 'birthdate',
    Company: 'company',
    'Address 1': 'streetAddress',
    'City / Town': 'city',
    County: 'county',
    State: 'stateOrProvince',
    'Zip / Postal Code': 'zipOrPostalCode',
    Country: 'countryOrRegion',
    'Email Address': 'email',
    Phone: 'phoneNumber',
};

/** match key and get the value: 'NoteType:Credit Card' */
export const extractLastPassFieldValue = (value: Maybe<string>, key: string) => {
    if (!value) return null;
    const match = value.match(new RegExp(`${key}${KEY_SEPARATOR}(.*)`));
    return match && match[1];
};

export const formatLastPassCCExpirationDate = (extra: LastPassItem['extra']) => {
    /* lastpass exp date format: 'January, 2025' */
    const unformatted = extractLastPassFieldValue(extra, 'Expiration Date');
    if (!unformatted) return null;

    /* Firefox requires a day to be present in the date to be valid */
    const date = new Date(`15 ${unformatted} UTC`);
    return `${String(date.getUTCMonth() + 1).padStart(2, '0')}${date.getUTCFullYear()}`;
};

/** LastPass appends the country code in the number.
 * The phone extension should be appended */
const formatLastPassPhoneNumber = (value: string): string => {
    try {
        const parsedValue = JSON.parse(value);
        return `${parsedValue?.num ?? ''}${parsedValue?.ext ?? ''}`;
    } catch {
        return '';
    }
};

/** LastPass stores birthday's as {month},{day},{year}.
 * It allows empty date parts so we should handle :
 * - `,14,1990` -> `14, 1990`
 * - `December,,1990` -> `December, 1990`
 * - `December,,` -> `December`
 * - `,,` -> `` */
const formatLastPassBirthdate = (value: string): string =>
    value
        .split(',')
        .map((str) => str.trim())
        .filter(truthy)
        .join(', ');

const formatLastPassFieldValue = (value: string, field: IdentityFieldName): string => {
    switch (field) {
        case 'phoneNumber':
            return formatLastPassPhoneNumber(value);
        case 'birthdate':
            return formatLastPassBirthdate(value);
        default:
            return String(value || '');
    }
};

export const extractLastPassIdentity = (importItem: LastPassItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    const fields =
        importItem.extra
            ?.split('\n')
            .slice(1)
            .map((field) => {
                const sepIndex = field.indexOf(KEY_SEPARATOR);
                if (sepIndex === -1) return null;

                const key = field.slice(0, sepIndex);
                const value = field.slice(sepIndex + KEY_SEPARATOR.length);
                return [key, value] as const;
            })
            .filter(truthy) ?? [];

    fields.forEach(([key, value]) => {
        const field = LAST_PASS_IDENTITY_FIELD_MAP[key];
        if (!field || !value) return;
        item.set('content', (content) => content.set(field, formatLastPassFieldValue(value, field)));
    });

    return item.data.content;
};
