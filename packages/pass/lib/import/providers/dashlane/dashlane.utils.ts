import { c } from 'ttag';

import {
    getEmailOrUsername,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type {
    IdentityExtraFieldsKey,
    IdentityFieldName,
    ItemContent,
    ItemImportIntent,
    Maybe,
} from '@proton/pass/types';

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

type DashlaneIdentityFieldConfig =
    | { type: 'field'; fieldName: IdentityFieldName }
    | { type: 'extraSection'; fieldSection: IdentityExtraFieldsKey; getFieldName: () => string };

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

const DASHLANE_DYNAMIC_IDENTITY_FIELD_MAP: Record<string, Record<string, DashlaneIdentityFieldConfig>> = {
    passport: {
        number: {
            type: 'field',
            fieldName: 'passportNumber',
        },
    },
    license: {
        number: {
            type: 'field',
            fieldName: 'licenseNumber',
        },
    },
    social_security: {
        number: {
            type: 'field',
            fieldName: 'socialSecurityNumber',
        },
    },
    company: {
        item_name: {
            type: 'field',
            fieldName: 'company',
        },
    },
    card: {
        number: {
            type: 'extraSection',
            fieldSection: 'extraContactDetails',
            getFieldName: () => c('Label').t`ID Card`,
        },
    },
    tax_number: {
        number: {
            type: 'extraSection',
            fieldSection: 'extraContactDetails',
            getFieldName: () => c('Label').t`Tax number`,
        },
    },
};

/* Dashlane has the same key for different properties, based on type */
const resolveFieldForType = (key: string, type?: string): Maybe<DashlaneIdentityFieldConfig> => {
    const dynamicFieldMatch = type ? DASHLANE_DYNAMIC_IDENTITY_FIELD_MAP?.[type]?.[key] : undefined;
    if (dynamicFieldMatch) return dynamicFieldMatch;

    const fieldName = DASHLANE_IDENTITY_FIELD_MAP[key];
    if (fieldName) return { type: 'field', fieldName };
};

export const extractDashlaneIdentity = (
    importItem: DashlanePersonalInfoItem | DashlaneIdItem
): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    Object.entries(importItem).forEach(([key, value]) => {
        if (!value) return;
        const field = resolveFieldForType(key, importItem.type);

        switch (field?.type) {
            case 'field': {
                item.set('content', (content) => content.set(field.fieldName, value));
                break;
            }

            case 'extraSection': {
                item.set('content', (content) =>
                    content.set(field.fieldSection, (section) => {
                        section.push({
                            fieldName: field.getFieldName(),
                            type: 'text',
                            data: { content: value },
                        });

                        return section;
                    })
                );
                break;
            }
        }
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

const extractDashlaneIdentityTitle = (item: DashlaneIdItem) => {
    const type = (() => {
        switch (item.type) {
            case 'card':
                return c('Label').t`ID Card`;
            case 'passport':
                return c('Label').t`Passport`;
            case 'license':
                return c('Label').t`License`;
            case 'social_security':
                return c('Label').t`Social security`;
            case 'tax_number':
                return c('Label').t`Tax number`;
            default:
                return '';
        }
    })();

    return type && item.name ? `${type} (${item.name})` : type;
};

export const processDashlaneIdentity: DashlaneItemParser<DashlaneIdItem> = (item): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: extractDashlaneIdentityTitle(item),
        ...extractDashlaneIdentity(item),
    });

export const processDashlanePersonalInfo: DashlaneItemParser<DashlanePersonalInfoItem> = (
    item
): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.title || item.item_name,
        ...extractDashlaneIdentity(item),
    });
