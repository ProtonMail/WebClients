// Vcard fields for which we keep track of PREF parameter
import isTruthy from '../helpers/isTruthy';
import { PublicKeyWithPref } from '../interfaces';
import { ContactProperties, ContactProperty } from '../interfaces/contacts/Contact';

const FIELDS_WITH_PREF = ['fn', 'email', 'tel', 'adr', 'key'];

/**
 * Given a vCard field, return true if we take into consideration its PREF parameters
 */
export const hasPref = (field: string): boolean => FIELDS_WITH_PREF.includes(field);

/**
 * For a vCard contact, check if it contains categories
 */
export const hasCategories = (vcardContact: ContactProperties): boolean => {
    return vcardContact.some(({ field, value }) => value && field === 'categories');
};

/**
 * For a list of vCard contacts, check if any contains categories
 */
export const haveCategories = (vcardContacts: ContactProperties[]): boolean => {
    return vcardContacts.some((contact) => hasCategories(contact));
};

/**
 * Make sure we keep only valid properties. In case adr property is badly formatted, re-format
 */
export const sanitizeProperties = (properties: ContactProperties = []): ContactProperties => {
    /*
        property values should be either arrays or strings
        transform to string otherwise (usually the case of a date for bday or anniversary fields)
        enforce value for adr field be an array
    */
    return properties
        .filter(({ value }) => value)
        .map((property) => {
            return Array.isArray(property.value) ? property : { ...property, value: property.value.toString() };
        })
        .map((property) => {
            const { field, value } = property;
            if (field !== 'adr' || Array.isArray(value)) {
                return property;
            }
            // assume the bad formatting used commas instead of semicolons
            const newValue = value.split(',').slice(0, 6);
            return { ...property, value: newValue };
        });
};

/**
 * Add `pref` to email, adr, tel, key to save order
 */
export const addPref = (properties: ContactProperties = []): ContactProperties => {
    const prefs = FIELDS_WITH_PREF.reduce((acc, field) => {
        acc[field] = 0;
        return acc;
    }, Object.create(null));

    return properties.map((property) => {
        if (!FIELDS_WITH_PREF.includes(property.field)) {
            return property;
        }
        const newPref = prefs[property.field] + 1;
        prefs[property.field] = newPref;

        return {
            ...property,
            pref: newPref,
        };
    });
};

/**
 * Function that sorts properties by preference
 */
export const sortByPref = (
    firstEl: Partial<ContactProperty> | PublicKeyWithPref,
    secondEl: Partial<ContactProperty> | PublicKeyWithPref
): number => {
    if (firstEl.pref && secondEl.pref) {
        return firstEl.pref - secondEl.pref;
    }
    return 0;
};

/**
 * Given a list of properties with preference, reorder them according to the preference
 */
export const reOrderByPref = (properties: ContactProperties): ContactProperties => {
    const { withPref, withoutPref } = properties.reduce<{
        withPref: ContactProperties;
        withoutPref: ContactProperties;
    }>(
        (acc, property) => {
            if (FIELDS_WITH_PREF.includes(property.field)) {
                acc.withPref.push(property);
            } else {
                acc.withoutPref.push(property);
            }
            return acc;
        },
        { withPref: [], withoutPref: [] }
    );

    return withPref.sort(sortByPref).concat(withoutPref);
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
 * Add `group` if missing for email.
 * @param {Array} properties
 * @returns {Array}
 */
export const addGroup = (properties: ContactProperties = []) => {
    const existingGroups = properties.map(({ group }) => group).filter(isTruthy);
    return properties.map((property) => {
        if (!['email'].includes(property.field) || property.group) {
            return property;
        }

        const group = generateNewGroupName(existingGroups);
        existingGroups.push(group);

        return {
            ...property,
            group,
        };
    });
};

type ValueProperty = string | string[];

/**
 * Given a contact and a field, get its preferred value
 */
export const getPreferredValue = (properties: ContactProperties, field: string): ValueProperty | undefined => {
    const filteredProperties = properties.filter(({ field: f }) => f === field);
    if (!filteredProperties.length) {
        return undefined;
    }
    return filteredProperties.sort(sortByPref)[0].value;
};

/**
 * Given a contact and a field, get all the values for it (which can appear several times in the array)
 * @param {Array<Object>}   properties
 * @param {String}          field
 *
 * @return {String,Array}
 */
export const getAllValues = (properties: ContactProperties, field: string): ValueProperty[] => {
    return properties.filter(({ field: f }) => f === field).map(({ value }) => value);
};
