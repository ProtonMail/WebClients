import type { IdentityFieldName } from '@proton/pass/hooks/identity/useIdentityForm';
import type { LastPassItem } from '@proton/pass/lib/import/providers/lastpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import type { IdentityDictionary } from './builders.types';

const UNIQUE_SEPARATOR = uniqueId();

const lastpassDictionary: IdentityDictionary = {
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

const lastpassValueFactory: Partial<{ [k in IdentityFieldName]: (v: string) => string }> = {
    phoneNumber: (value: string) => {
        try {
            const parsedValue = JSON.parse(value);
            return `${parsedValue.ext}${parsedValue.num}`;
        } catch {
            return '';
        }
    },
};

export const buildLastpassIdentity = (item: LastPassItem): ItemContent<'identity'> => {
    const emptyIdentity = itemBuilder('identity').data.content;
    return (
        item.extra
            ?.split('\n')
            .slice(1)
            .map((i) => i.replace(':', UNIQUE_SEPARATOR).split(UNIQUE_SEPARATOR))
            .reduce((acc, [key, dirtyValue]) => {
                const field = lastpassDictionary[key];
                if (!field) return acc;
                const value = lastpassValueFactory[field]?.(dirtyValue) ?? String(dirtyValue || '');
                return { ...acc, [field]: value };
            }, emptyIdentity) ?? emptyIdentity
    );
};
