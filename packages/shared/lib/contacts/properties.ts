import generateUID from '@proton/utils/generateUID';

import type { ContactValue } from '../interfaces/contacts';
import type { VCardContact, VCardProperty } from '../interfaces/contacts/VCard';
import { UID_PREFIX } from './constants';
import { isMultiValue } from './vcard';

export const FIELDS_WITH_PREF = ['fn', 'email', 'tel', 'adr', 'key', 'photo'];

export const getStringContactValue = (value: ContactValue): string => {
    if (Array.isArray(value)) {
        return getStringContactValue(value[0]);
    }
    // Shouldnt really happen but some boolean gets there as boolean instead of strings
    return String(value);
};

/**
 * Given a vCard field, return true if we take into consideration its PREF parameters
 */
export const hasPref = (field: string) => FIELDS_WITH_PREF.includes(field);

/**
 * For a vCard contact, check if it contains categories
 */
export const hasCategories = (vcardContact: VCardProperty[]) => {
    return vcardContact.some(({ field, value }) => value && field === 'categories');
};

/**
 * Extract categories from a vCard contact
 */
export const getContactCategories = (contact: VCardContact) => {
    return (contact.categories || [])
        .map(({ value, group }) => {
            if (Array.isArray(value)) {
                return group
                    ? value.map((singleValue) => ({ name: getStringContactValue(singleValue), group }))
                    : value.map((singleValue) => ({ name: getStringContactValue(singleValue) }));
            }
            return group ? { name: value, group } : { name: value };
        })
        .flat();
};

/**
 * Generate new group name that doesn't exist
 */
export const generateNewGroupName = (existingGroups: string[] = []): string => {
    let index = 1;
    let found = false;

    while (!found) {
        if (existingGroups.includes(`item${index}`)) {
            index++;
        } else {
            found = true;
        }
    }

    return `item${index}`;
};

/**
 * Extract emails from a vCard contact
 */
export const getContactEmails = (contact: VCardContact) => {
    return (contact.email || []).map(({ value, group }) => {
        if (!group) {
            throw new Error('Email properties should have a group');
        }
        return {
            email: getStringContactValue(value),
            group,
        };
    });
};

export const createContactPropertyUid = () => generateUID(UID_PREFIX);

export const getContactPropertyUid = (uid: string) => Number(uid.replace(`${UID_PREFIX}-`, ''));

// TODO: Deprecate this function. See VcardProperty interface
export const getVCardProperties = (vCardContact: VCardContact): VCardProperty[] => {
    return Object.values(vCardContact).flatMap((property) => {
        if (Array.isArray(property)) {
            return property;
        } else {
            return [property];
        }
    });
};

export const fromVCardProperties = (vCardProperties: VCardProperty[]): VCardContact => {
    const vCardContact = {} as VCardContact;

    vCardProperties.forEach((property) => {
        const field = property.field as keyof VCardContact;

        if (isMultiValue(field)) {
            if (!vCardContact[field]) {
                vCardContact[field] = [] as any;
            }
            (vCardContact[field] as VCardProperty[]).push(property);
        } else {
            vCardContact[field] = property as any;
        }
    });

    return vCardContact;
};

export const mergeVCard = (vCardContacts: VCardContact[]): VCardContact => {
    return fromVCardProperties(vCardContacts.flatMap(getVCardProperties));
};

export const updateVCardContact = (vCardContact: VCardContact, vCardProperty: VCardProperty) => {
    const properties = getVCardProperties(vCardContact);
    const newProperties = properties.map((property) => (property.uid === vCardProperty.uid ? vCardProperty : property));
    return fromVCardProperties(newProperties);
};

export const addVCardProperty = (vCardContact: VCardContact, vCardProperty: VCardProperty) => {
    const properties = getVCardProperties(vCardContact);
    const newVCardProperty = { ...vCardProperty, uid: createContactPropertyUid() };
    properties.push(newVCardProperty);
    const newVCardContact = fromVCardProperties(properties);
    return { newVCardProperty, newVCardContact };
};

export const removeVCardProperty = (vCardContact: VCardContact, uid: string) => {
    let properties = getVCardProperties(vCardContact);

    const match = properties.find((property) => property.uid === uid);

    if (!match) {
        return vCardContact;
    }

    properties = properties.filter((property) => property.uid !== uid);

    // If we remove an email with groups attached to it, remove all groups properties too
    if (match.field === 'email' && match.group !== undefined) {
        properties = properties.filter((property) => property.group !== match.group);
    }

    // Never remove the last photo property
    if (match.field === 'photo') {
        const photoCount = properties.filter((property) => property.field === 'photo').length;
        if (photoCount === 0) {
            properties.push({ field: 'photo', value: '', uid: generateUID(UID_PREFIX) });
        }
    }

    return fromVCardProperties(properties);
};

export const compareVCardPropertyByUid = (a: VCardProperty, b: VCardProperty) => {
    const aUid = getContactPropertyUid(a.uid);
    const bUid = getContactPropertyUid(b.uid);
    return aUid > bUid ? 1 : -1;
};

export const compareVCardPropertyByPref = (a: VCardProperty, b: VCardProperty) => {
    const aPref = Number(a.params?.pref);
    const bPref = Number(b.params?.pref);
    if (!isNaN(aPref) && !isNaN(bPref) && aPref !== bPref) {
        return aPref > bPref ? 1 : -1;
    }
    return compareVCardPropertyByUid(a, b);
};

export const getSortedProperties = (vCardContact: VCardContact, field: string) => {
    return getVCardProperties(vCardContact)
        .filter((property) => property.field === field)
        .sort(compareVCardPropertyByPref);
};
