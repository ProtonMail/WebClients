import {
    getEmailOrUsername,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, ItemImportIntent, Maybe } from '@proton/pass/types';

import type {
    DashlaneIdItem,
    DashlaneItemParser,
    DashlaneLoginItem,
    DashlaneNoteItem,
    DashlanePaymentItem,
    DashlanePersonalInfoItem,
} from './dashlane.types';

export const DASHLANE_LOGINS_EXPECTED_HEADERS: (keyof DashlaneLoginItem)[] = [
    'username',
    'title',
    'password',
    'note',
    'url',
    'category',
    'otpSecret',
];

export const DASHLANE_NOTES_EXPECTED_HEADERS: (keyof DashlaneNoteItem)[] = ['title', 'note'];

export const DASHLANE_CREDIT_CARDS_EXPECTED_HEADERS: (keyof DashlanePaymentItem)[] = [
    'type',
    'account_name',
    'cc_number',
    'code',
    'expiration_month',
    'expiration_year',
];

export const DASHLANE_IDS_EXPECTED_HEADERS: (keyof DashlaneIdItem)[] = [
    'type',
    'number',
    'name',
    'issue_date',
    'expiration_date',
    'place_of_issue',
    'state',
];

export const DASHLANE_PERSONAL_INFO_EXPECTED_HEADERS: (keyof DashlanePersonalInfoItem)[] = [
    'type',
    'address',
    'address_apartment',
    'address_building',
    'address_door_code',
    'address_floor',
    'address_recipient',
    'city',
    'country',
    'date_of_birth',
    'email',
    'email_type',
    'first_name',
    'item_name',
    'job_title',
    'last_name',
    'login',
    'middle_name',
    'phone_number',
    'place_of_birth',
    'state',
    'title',
    'url',
    'zip',
];

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

export const extractDashlaneIdentity = (
    importItem: DashlanePersonalInfoItem | DashlaneIdItem
): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    Object.entries(importItem).forEach(([key, value]) => {
        const fieldName = resolveFieldNameForType(key, importItem.type);
        if (fieldName && value) item.set('content', (content) => content.set(fieldName, value));
    });

    return item.data.content;
};

export const processDashlaneLogin: DashlaneItemParser<DashlaneLoginItem> = (
    item,
    importUsername
): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.title,
        note: item.note,
        ...(importUsername ? getEmailOrUsername(item.username) : { email: item.username }),
        password: item.password,
        urls: [item.url],
        totp: item.otpSecret,
        extraFields: [item.username2, item.username3].filter(Boolean).map((username, index) => ({
            fieldName: `username${index + 1}`,
            type: 'text',
            data: { content: username ?? '' },
        })),
    });

export const processDashlaneNote: DashlaneItemParser<DashlaneNoteItem> = (item): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: item.note,
    });

export const processDashlaneCC: DashlaneItemParser<DashlanePaymentItem> = (item): ItemImportIntent<'creditCard'> =>
    importCreditCardItem({
        name: item.name,
        note: item.note,
        cardholderName: item.account_name,
        number: item.cc_number,
        verificationNumber: item.code,
        expirationDate:
            item.expiration_month && item.expiration_year
                ? `${item.expiration_month.padStart(2, '0')}${item.expiration_year}`
                : '',
    });

export const processDashlaneIdentity: DashlaneItemParser<DashlanePersonalInfoItem | DashlaneIdItem> = (
    item
): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: 'item_name' in item ? item.item_name : item.name,
        ...extractDashlaneIdentity(item),
    });
