// Vcard fields for which we keep track of PREF parameter
import isTruthy from '../helpers/isTruthy';
import { PublicKeyWithPref } from '../interfaces';
import { ContactProperties, ContactProperty } from '../interfaces/contacts/Contact';

const FIELDS_WITH_PREF = ['fn', 'email', 'tel', 'adr', 'key'];

/**
 * Given a vCard field, return true if we take into consideration its PREF parameters
 */
export const hasPref = (field: string) => FIELDS_WITH_PREF.includes(field);

/**
 * For a vCard contact, check if it contains categories
 */
export const hasCategories = (vcardContact: ContactProperties) => {
    return vcardContact.some(({ field, value }) => value && field === 'categories');
};

/**
 * For a list of vCard contacts, check if any contains categories
 */
export const haveCategories = (vcardContacts: ContactProperties[]) => {
    return vcardContacts.some((contact) => hasCategories(contact));
};

/**
 * Extract categories from a vCard contact
 */
export const getContactCategories = (properties: ContactProperties) => {
    return properties
        .filter(({ field }) => field === 'categories')
        .map(({ value, group }) => {
            if (Array.isArray(value)) {
                return group
                    ? value.map((singleValue) => ({ name: singleValue, group }))
                    : value.map((singleValue) => ({ name: singleValue }));
            }
            return group ? { name: value, group } : { name: value };
        })
        .flat();
};

/**
 * Make sure we keep only valid properties.
 * * In case adr property is badly formatted, re-format
 * * Split multi-valued categories properties, otherwise ICAL.js does not handle them
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
            if ((field === 'adr' || field === 'org') && !Array.isArray(value)) {
                // assume the bad formatting used commas instead of semicolons
                const newValue = value.split(',').slice(0, 6);
                return { ...property, value: newValue };
            }
            if (field === 'categories' && Array.isArray(value)) {
                // Array-valued categories pose problems to ICAL (even though a vcard with CATEGORIES:ONE,TWO
                // will be parsed into a value ['ONE', 'TWO'], ICAL.js fails to transform it back). So we convert
                // an array-valued category into several properties
                return value.map((category) => ({ ...property, value: category }));
            }
            return property;
        })
        .flat();
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

/**
 * Given a contact and a field, get its preferred value
 */
export const getPreferredValue = (properties: ContactProperties, field: string) => {
    const filteredProperties = properties.filter(({ field: f }) => f === field);
    if (!filteredProperties.length) {
        return;
    }
    return filteredProperties.sort(sortByPref)[0].value;
};

/**
 * Extract emails from a vCard contact
 */
export const getContactEmails = (properties: ContactProperties) => {
    return addGroup(properties)
        .filter(({ field }) => field === 'email')
        .map(({ value, group }) => {
            if (!group) {
                throw new Error('Email properties should have a group');
            }
            return {
                email: Array.isArray(value) ? value[0] : value,
                group,
            };
        });
};
