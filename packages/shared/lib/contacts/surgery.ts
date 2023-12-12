import { isValid } from 'date-fns';
import { c } from 'ttag';

import isTruthy from '@proton/utils/isTruthy';

import { VCardContact, VCardProperty } from '../interfaces/contacts/VCard';
import {
    FIELDS_WITH_PREF,
    compareVCardPropertyByPref,
    createContactPropertyUid,
    fromVCardProperties,
    generateNewGroupName,
    getVCardProperties,
} from './properties';

export const getFallbackFNValue = () => {
    return c('Default display name vcard').t`Unknown`;
};

export const prepareForEdition = (vCardContact: VCardContact) => {
    const result = { ...vCardContact };

    if (!result.fn || result.fn.length === 0) {
        result.fn = [{ field: 'fn', value: '', uid: createContactPropertyUid() }];
    }

    if (!result.photo || result.photo.length === 0) {
        result.photo = [{ field: 'photo', value: '', uid: createContactPropertyUid() }];
    }

    if (!result.email || result.email.length === 0) {
        result.email = [{ field: 'email', value: '', uid: createContactPropertyUid() }];
    }

    if (!result.n) {
        result.n = {
            field: 'n',
            value: {
                familyNames: [''],
                givenNames: [''],
                additionalNames: [''],
                honorificPrefixes: [''],
                honorificSuffixes: [''],
            },
            uid: createContactPropertyUid(),
        };
    }

    return result;
};

export const prepareForSaving = (vCardContact: VCardContact) => {
    const properties = getVCardProperties(vCardContact);
    const newProperties = properties.filter((property) => {
        if (property.field === 'adr') {
            return property.value && Object.values(property.value).some(isTruthy);
        }
        if (property.field === 'bday' || property.field === 'anniversary') {
            return property.value.text || (property.value.date && isValid(property.value.date));
        }
        if (property.field === 'gender') {
            return isTruthy(property.value?.text);
        }
        return isTruthy(property.value);
    });
    const result = fromVCardProperties(newProperties);

    if (result.categories) {
        // Array-valued categories pose problems to ICAL (even though a vcard with CATEGORIES:ONE,TWO
        // will be parsed into a value ['ONE', 'TWO'], ICAL.js fails to transform it back). So we convert
        // an array-valued category into several properties
        result.categories = result.categories.flatMap((category) => {
            if (Array.isArray(category.value)) {
                return category.value.map((value) => ({ ...category, value }));
            } else {
                return [category];
            }
        });
    }

    // Add `pref` to email, adr, tel, key to save order
    (FIELDS_WITH_PREF as (keyof VCardContact)[]).forEach((field) => {
        if (result[field]) {
            result[field] = (result[field] as VCardProperty[])
                .sort(compareVCardPropertyByPref)
                .map((property, index) => ({
                    ...property,
                    params: { ...property.params, pref: String(index + 1) },
                })) as any;
        }
    });

    // Add `group` if missing for email.
    if (result.email) {
        const existingGroups = result.email.map(({ group }) => group).filter(isTruthy);

        result.email = result.email.map((property) => {
            if (property.group) {
                return property;
            } else {
                const group = generateNewGroupName(existingGroups);
                existingGroups.push(group);
                return { ...property, group };
            }
        });
    }

    return result;
};

/**
 * Some contacts might miss the "FN" property, but we expect one for the vCard to be valid.
 * In that case, use the contact email as FN instead.
 * If no email is found, return undefined
 */
export const getSupportedContactName = (contact: VCardContact) => {
    return contact.email?.[0]?.value;
};
