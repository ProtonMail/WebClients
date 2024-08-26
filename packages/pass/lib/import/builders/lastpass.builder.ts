import type { LastPassItem } from '@proton/pass/lib/import/providers/lastpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

const UNIQUE_SEPARATOR = uniqueId();

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

const parsePhoneNumber = (value: string): string => {
    try {
        const parsedValue = JSON.parse(value);
        return `${parsedValue.ext}${parsedValue.num}`;
    } catch {
        return '';
    }
};

const formatFieldValue = (value: string, field: IdentityFieldName): string => {
    switch (field) {
        case 'phoneNumber':
            return parsePhoneNumber(value);
        default:
            return String(value || '');
    }
};

export const buildLastpassIdentity = (importItem: LastPassItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    const fields =
        importItem.extra
            ?.split('\n')
            .slice(1)
            .map((i) => i.replace(':', UNIQUE_SEPARATOR).split(UNIQUE_SEPARATOR)) ?? [];

    fields.forEach(([key, value]) => {
        const field = LAST_PASS_IDENTITY_FIELD_MAP[key];
        if (!field || !value) return;
        item.set('content', (content) => content.set(field, formatFieldValue(value, field)));
    });

    return item.data.content;
};
