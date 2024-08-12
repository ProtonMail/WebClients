import type { NordPassItem } from '@proton/pass/lib/import/providers/nordpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent } from '@proton/pass/types';

import type { IdentityDictionary } from './builders.types';

const nordPassDictionary: IdentityDictionary = {
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

export const buildNordPassIdentity = (item: NordPassItem): ItemContent<'identity'> =>
    Object.entries(item).reduce((acc, [key, value]) => {
        const field = nordPassDictionary[key];
        return field ? { ...acc, [field]: value ?? '' } : acc;
    }, itemBuilder('identity').data.content);
