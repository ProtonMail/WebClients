import type { DashlaneIdItem, DashlanePersonalInfoItem } from '@proton/pass/lib/import/providers/dashlane.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, Maybe } from '@proton/pass/types';

export enum FileKey {
    Login = 'Login',
    Ids = 'Ids',
    Payments = 'Payments',
    PersonalInfo = 'PersonalInfo',
    SecureNotes = 'SecureNotes',
}

const DASHLANE_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
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

const DASHLANE_DYNAMIC_IDENTITY_FIELD_MAP: Record<string, Record<string, IdentityFieldName>> = {
    passport: { number: 'passportNumber' },
    license: { number: 'licenseNumber' },
    social_security: { number: 'socialSecurityNumber' },
    company: { item_name: 'company' },
};

/* Dashlane has the same key for different properties, based on type */
const resolveFieldNameForType = (key: string, type?: string): Maybe<IdentityFieldName> => {
    const match = type ? DASHLANE_DYNAMIC_IDENTITY_FIELD_MAP?.[type]?.[key] : null;
    return match ?? DASHLANE_IDENTITY_FIELD_MAP[key];
};

export const buildDashlaneIdentity = (
    importItem: DashlanePersonalInfoItem | DashlaneIdItem
): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    Object.entries(importItem).forEach(([key, value]) => {
        const fieldName = resolveFieldNameForType(key, importItem.type);
        if (fieldName && value) item.set('content', (content) => content.set(fieldName, value));
    });

    return item.data.content;
};
