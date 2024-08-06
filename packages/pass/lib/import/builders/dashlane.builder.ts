import type { DashlaneIdItem, DashlanePersonalInfoItem } from '@proton/pass/lib/import/providers/dashlane.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent } from '@proton/pass/types';

import type { IdentityDictionary } from './builders.types';

const dashlaneDictionary: IdentityDictionary = {
    address: 'streetAddress',
    address_floor: 'floor',
    city: 'city',
    country: 'countryOrRegion',
    date_of_birth: 'birthdate',
    email: 'email',
    first_name: 'firstName',
    job_title: 'jobTitle',
    last_name: 'lastName',
    login: 'xHandle',
    middle_name: 'middleName',
    name: 'fullName',
    phone_number: 'phoneNumber',
    state: 'stateOrProvince',
    url: 'website',
    zip: 'zipOrPostalCode',
};

const fieldsTypeFactory: { [key: string]: IdentityDictionary[] } = {
    passport: [{ number: 'passportNumber' }],
    license: [{ number: 'licenseNumber' }],
    social_security: [{ number: 'socialSecurityNumber' }],
    company: [{ item_name: 'company' }],
};

// Dashlane has the same key for different properties, based on type
const hydrateDictionaryByType = (type: string) => {
    const dynamicFields = fieldsTypeFactory[type] ?? [];
    dynamicFields.forEach((field) => Object.assign(dashlaneDictionary, field));
};

export const buildDashlaneIdentity = (item: DashlanePersonalInfoItem | DashlaneIdItem): ItemContent<'identity'> => {
    hydrateDictionaryByType(item?.type ?? '');
    return Object.entries(item).reduce((acc, [key, value]) => {
        const field = dashlaneDictionary[key];
        return field ? { ...acc, [field]: value } : acc;
    }, itemBuilder('identity').data.content);
};
