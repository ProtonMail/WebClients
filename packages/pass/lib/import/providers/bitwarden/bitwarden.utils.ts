import { c } from 'ttag';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { DeobfuscatedItemExtraField, IdentityFieldName, ItemContent, MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

import type { BitwardenCCItem, BitwardenCustomField, BitwardenLoginItem, BitwardenSshKeyItem } from './bitwarden.types';
import { BitwardenCustomFieldType, type BitwardenIdentityItem } from './bitwarden.types';

/** Bitwarden stores android linked apps as :
 * `androidapp://ch.protonmail.android` */
const BITWARDEN_ANDROID_APP_FLAG = 'androidapp://';

const BITWARDEN_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
    address1: 'streetAddress',
    address2: 'streetAddress',
    address3: 'streetAddress',
    city: 'city',
    state: 'stateOrProvince',
    postalCode: 'zipOrPostalCode',
    country: 'countryOrRegion',
    company: 'company',
    email: 'email',
    phone: 'phoneNumber',
    ssn: 'socialSecurityNumber',
    username: 'xHandle',
    passportNumber: 'passportNumber',
    licenseNumber: 'licenseNumber',
};

const BITWARDEN_CUSTOM_FIELD_TYPES = Object.values(BitwardenCustomFieldType);

export const isBitwardenLinkedAndroidAppUrl = (url: string) => {
    try {
        return url.startsWith(BITWARDEN_ANDROID_APP_FLAG);
    } catch (e) {
        return false;
    }
};

export const extractBitwardenUrls = (item: BitwardenLoginItem) =>
    (item.login.uris ?? []).reduce<{ web: string[]; android: string[] }>(
        (acc, { uri }) => {
            if (isBitwardenLinkedAndroidAppUrl(uri)) {
                acc.android.push(uri.replace(BITWARDEN_ANDROID_APP_FLAG, ''));
                return acc;
            } else {
                acc.web.push(uri);
            }

            return acc;
        },
        { web: [], android: [] }
    );

export const formatBitwardenCCExpirationDate = (item: BitwardenCCItem) => {
    const { expMonth, expYear } = item.card;
    if (!expMonth || !expYear) return '';

    return `${String(expMonth).padStart(2, '0')}${expYear}`;
};

const bitwardenCustomFieldToExtraField = ({
    type,
    name,
    value,
}: BitwardenCustomField): MaybeNull<DeobfuscatedItemExtraField> => {
    const content = value ?? '';

    switch (type) {
        case BitwardenCustomFieldType.TEXT:
            return { fieldName: name || c('Label').t`Text`, type: 'text', data: { content } };
        case BitwardenCustomFieldType.HIDDEN:
            return { fieldName: name || c('Label').t`Hidden`, type: 'hidden', data: { content } };
        case BitwardenCustomFieldType.CHECKBOX:
            return { fieldName: name || c('Label').t`Checkbox`, type: 'text', data: { content } };
        default:
            return null;
    }
};

export const extractBitwardenExtraFields = (customFields?: BitwardenCustomField[]) =>
    customFields?.map(bitwardenCustomFieldToExtraField).filter(truthy) ?? [];

export const extractBitwardenIdentity = ({ fields, identity }: BitwardenIdentityItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');
    const extraSectionFields = fields?.filter((f) => BITWARDEN_CUSTOM_FIELD_TYPES.includes(f.type)) ?? [];

    item.set('content', (content) => {
        if (extraSectionFields.length > 0) {
            content.set('extraSections', (sections) => {
                sections.push({
                    sectionName: c('Label').t`Extra fields`,
                    sectionFields: extractBitwardenExtraFields(extraSectionFields),
                });
                return sections;
            });
        }

        /* Certain bitwarden identity fields should be merged.
         * eg: `address1`, `address2` and `address3` should be
         * concatenated into the `streetAddress` field */
        Object.entries(identity).forEach(([key, value]) => {
            const field = BITWARDEN_IDENTITY_FIELD_MAP[key];
            if (field && value) content.set(field, (current) => (current ? `${current} ${value}` : value));
        });

        return content;
    });

    return item.data.content;
};

export const extractBitwardenSSHSections = ({ sshKey }: BitwardenSshKeyItem): ItemContent<'sshKey'>['sections'] => {
    if (sshKey.keyFingerprint) {
        return [
            {
                sectionName: c('Label').t`Extra fields`,
                sectionFields: [
                    {
                        type: 'hidden',
                        fieldName: c('Label').t`Key fingerprint`,
                        data: { content: sshKey.keyFingerprint },
                    },
                ],
            },
        ];
    }

    return [];
};
