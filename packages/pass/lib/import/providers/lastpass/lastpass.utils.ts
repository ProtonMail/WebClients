import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import type { LastPassItem } from './lastpass.types';

const UNIQUE_SEPARATOR = uniqueId();

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
export const extractLastPassFieldValue = (extra: LastPassItem['extra'], key: string) => {
    if (!extra) return null;
    const match = extra.match(new RegExp(`${key}:(.*)`));
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

const formatLastPassPhoneNumber = (value: string): string => {
    try {
        const parsedValue = JSON.parse(value);
        return `${parsedValue.ext}${parsedValue.num}`;
    } catch {
        return '';
    }
};

const formatLastPassFieldValue = (value: string, field: IdentityFieldName): string => {
    switch (field) {
        case 'phoneNumber':
            return formatLastPassPhoneNumber(value);
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
            .map((i) => i.replace(':', UNIQUE_SEPARATOR).split(UNIQUE_SEPARATOR)) ?? [];

    fields.forEach(([key, value]) => {
        const field = LAST_PASS_IDENTITY_FIELD_MAP[key];
        if (!field || !value) return;
        item.set('content', (content) => content.set(field, formatLastPassFieldValue(value, field)));
    });

    return item.data.content;
};
