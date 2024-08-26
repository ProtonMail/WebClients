import type { NordPassItem } from '@proton/pass/lib/import/providers/nordpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent } from '@proton/pass/types';

const nordPassDictionary: Record<string, IdentityFieldName> = {
    url: 'website',
    zipcode: 'zipOrPostalCode',
    full_name: 'fullName',
    phone_number: 'phoneNumber',
    email: 'email',
    address1: 'streetAddress',
    city: 'city',
    country: 'countryOrRegion',
    state: 'stateOrProvince',
};

export const buildNordPassIdentity = (importItem: NordPassItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    Object.entries(importItem).forEach(([key, value]) => {
        const field = nordPassDictionary[key];
        if (field) item.set('content', (content) => content.set(field, value ?? ''));
    });

    return item.data.content;
};
