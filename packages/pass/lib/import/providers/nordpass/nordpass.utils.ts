import type { NordPassItem } from '@proton/pass/lib/import/providers/nordpass/nordpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent } from '@proton/pass/types';

export const NORDPASS_EXPECTED_HEADERS: (keyof NordPassItem)[] = [
    'name',
    'url',
    'username',
    'password',
    'note',
    'cardholdername',
    'cardnumber',
    'cvc',
    'expirydate',
    'zipcode',
    'folder',
    'full_name',
    'phone_number',
    'email', // not used for "Login" items, maybe for "Personal Info" items instead
    'address1',
    'address2',
    'city',
    'country',
    'state',
    'type',
];

const NORDPASS_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
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

export const extractNordPassIdentity = (importItem: NordPassItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    Object.entries(importItem).forEach(([key, value]) => {
        const field = NORDPASS_IDENTITY_FIELD_MAP[key];
        if (field) item.set('content', (content) => content.set(field, value ?? ''));
    });

    return item.data.content;
};
