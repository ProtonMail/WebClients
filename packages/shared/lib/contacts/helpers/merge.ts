import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import { normalize } from '../../helpers/string';
import { FormattedContact } from '../../interfaces/contacts/FormattedContact';
import { VCardContact, VCardProperty } from '../../interfaces/contacts/VCard';
import {
    fromVCardProperties,
    generateNewGroupName,
    getStringContactValue,
    getVCardProperties,
    hasPref,
} from '../properties';
import { getFallbackFNValue, prepareForSaving } from '../surgery';
import { ONE_OR_MORE_MAY_BE_PRESENT, ONE_OR_MORE_MUST_BE_PRESENT, PROPERTIES, isCustomField } from '../vcard';

const getPref = (params: { [key: string]: string | undefined } | undefined) => {
    const numValue = Number(params?.pref || '');
    return isNaN(numValue) ? 0 : numValue;
};

/**
 * Given an array of keys and an object storing an index for each key,
 * if the object contains any of these keys, return the index stored in the object
 * for the first of such keys. Otherwise return -1
 */
const findKeyIndex = (keys: number[], obj: { [key: number]: number }) => {
    for (const key of keys) {
        if (obj[key] !== undefined) {
            return obj[key];
        }
    }
    return -1;
};

/**
 * Given a list of connections (a "connection" is a list of keys [key1, key2, ...] connected for some reason),
 * find recursively all connections and return a new list of connections with no key repeated.
 * E.g.: [[1, 2, 3], [3, 5], [4, 6]] ->  [[1, 2, 3, 5], [4, 6]]
 * @param connections
 */
export const linkConnections = (connections: number[][]): number[][] => {
    let didModify = false;

    const { newConnections } = connections.reduce<{
        connected: { [key: number]: number };
        newConnections: number[][];
    }>(
        (acc, connection) => {
            const { connected, newConnections } = acc;
            // check if some index in current connection has been connected already
            const indexFound = findKeyIndex(connection, connected);

            if (indexFound !== -1) {
                // add indices in current connection to the connected connection
                newConnections[indexFound] = unique([...connection, ...newConnections[indexFound]]);
                for (const key of connection) {
                    // update list of connected indices
                    if (connected[key] === undefined) {
                        connected[key] = indexFound;
                    }
                }
                didModify = true;
            } else {
                // update list of connected indices
                for (const key of connection) {
                    connected[key] = newConnections.length;
                }
                newConnections.push(connection);
            }
            return acc;
        },
        { connected: Object.create(null), newConnections: [] }
    );
    // if some indices previously unconnected have been connected,
    // run linkConnections again
    if (didModify) {
        return linkConnections(newConnections);
    }
    // otherwise no more connections to be established
    return connections;
};

/**
 * Given a list of contacts, extract the ones that can be merged
 * @param contacts      Each contact is an object { ID, emails, Name, LabelIDs }
 *
 * @returns List of groups of contacts that can be merged
 */
export const extractMergeable = (contacts: FormattedContact[] = []) => {
    const fallbackFN = getFallbackFNValue();
    const fallbackNormalizedProtonNames = unique([
        'Unknown',
        // fallback value used by the back-end (they add the angular brackets)
        '<Unknown>',
        fallbackFN,
        `<${fallbackFN}>`,
    ]).map((name) => normalize(name));
    // detect duplicate names
    // namesConnections = { name: [contact indices with this name] }
    const namesConnections = Object.values(
        contacts.reduce<{ [Name: string]: number[] }>((acc, { Name }, index) => {
            const name = normalize(Name);

            if (fallbackNormalizedProtonNames.includes(name)) {
                // These names have been probably added by us during an import (because we did not have anything better).
                // So they will most likely not identify identical contacts
                return acc;
            }

            if (!acc[name]) {
                acc[name] = [index];
            } else {
                acc[name].push(index);
            }

            return acc;
        }, Object.create(null))
    )
        .map(unique)
        .filter((connection) => connection.length > 1);

    // detect duplicate emails
    // emailConnections = { email: [contact indices with this email] }
    const emailConnections = Object.values(
        contacts.reduce<{ [email: string]: number[] }>((acc, { emails }, index) => {
            emails
                .map((email) => normalize(email))
                .forEach((email) => {
                    if (!acc[email]) {
                        acc[email] = [index];
                    } else {
                        acc[email].push(index);
                    }
                });
            return acc;
        }, Object.create(null))
    )
        .map(unique)
        .filter((connection) => connection.length > 1);

    // Now we collect contact indices that go together
    // either in duplicate names or duplicate emails.
    const allConnections = linkConnections([...namesConnections, ...emailConnections]);

    return allConnections.map((indices) => indices.map((index) => contacts[index]));
};

/**
 * Given the value and field of a contact property, and a list of merged properties,
 * return and object with a Boolean that tells if the value has been merged or is a new value.
 * In the latter case, return the new value in the object
 * @dev  Normalize strings in all fields but EMAIL
 */
export const extractNewValue = (
    value: any,
    field: string,
    mergedValues: any[] = []
): { isNewValue: boolean; newValue: any | undefined } => {
    if (field === 'org') {
        // compare with merged values. Normalize all strings
        const isRepeatedValue = mergedValues.some((mergedValue) => {
            const mergedValueAsArray: string[] = [
                mergedValue.organizationalName,
                ...(mergedValue.organizationalUnitNames ?? []),
            ].filter(isTruthy);

            // each of the components inside be an array itself
            const valueAsArray: string[] = [
                value?.organizationalName,
                ...(value?.organizationalUnitNames ?? []),
            ].filter(isTruthy);

            // value order is important, that's we why do an exact match check and not just check that one array includes the value of another
            const isSameValue = valueAsArray.every(
                (str, index) => normalize(str) === normalize(mergedValueAsArray[index] ?? '')
            );

            return isSameValue;
        });

        return { isNewValue: !isRepeatedValue, newValue: isRepeatedValue ? undefined : value };
    }
    if (field === 'adr') {
        const isNew =
            mergedValues.filter((mergedValue) => {
                return Object.keys(value).every((key) => normalize(value[key]) === normalize(mergedValue[key]));
            }).length === 0;
        return { isNewValue: isNew, newValue: isNew ? value : undefined };
    }
    if (['bday', 'anniversary'].includes(field)) {
        const isNew =
            mergedValues.filter((mergedValue) => {
                return (
                    normalize(value.text) === normalize(mergedValue.text) &&
                    value.date?.getTime?.() === mergedValue.date?.getTime?.()
                );
            }).length === 0;
        return { isNewValue: isNew, newValue: isNew ? value : undefined };
    }
    if (field === 'gender') {
        const isNew =
            mergedValues.filter((mergedValue) => {
                return normalize(value.text) === normalize(mergedValue.text) && value.gender === mergedValue.gender;
            }).length === 0;
        return { isNewValue: isNew, newValue: isNew ? value : undefined };
    }
    // for the other fields, value is a string, and mergedValues an array of strings
    // for EMAIL field, do not normalize, only trim
    if (field === 'email') {
        const isNew = !mergedValues
            .map((val) => getStringContactValue(val).trim())
            .includes(getStringContactValue(value).trim());
        return { isNewValue: isNew, newValue: isNew ? value : undefined };
    }

    // for the rest of the fields, normalize strings
    const isNew = !mergedValues
        .map((c) => normalize(getStringContactValue(c)))
        .includes(normalize(getStringContactValue(value)));
    return { isNewValue: isNew, newValue: isNew ? value : undefined };
};

/**
 * Merge a list of contacts. The contacts must be ordered in terms of preference.
 * @param contacts Each contact is a list of properties [{ pref, field, group, type, value }]
 * @return The merged contact
 */
export const merge = (contacts: VCardContact[] = []): VCardContact => {
    if (!contacts.length) {
        return { fn: [] };
    }

    const contactsProperties = contacts
        .map((contact) => prepareForSaving(contact)) // Extra security to have well formed contact input
        .map((contact) => getVCardProperties(contact));

    const { mergedContact } = contactsProperties.reduce<{
        mergedContact: VCardProperty[];
        mergedProperties: { [field: string]: any[] };
        mergedPropertiesPrefs: { [field: string]: number[] };
        mergedGroups: { [email: string]: string };
    }>(
        (acc, contactProperties, index) => {
            const { mergedContact, mergedProperties, mergedPropertiesPrefs, mergedGroups } = acc;
            if (index === 0) {
                // merged contact inherits all properties from the first contact
                mergedContact.push(...contactProperties);
                // keep track of merged properties with respective prefs and merged groups
                for (const { field, value, group, params } of contactProperties) {
                    if (!mergedProperties[field]) {
                        mergedProperties[field] = [value];
                        if (hasPref(field)) {
                            mergedPropertiesPrefs[field] = [getPref(params)];
                        }
                    } else {
                        mergedProperties[field].push(value);
                        if (hasPref(field)) {
                            mergedPropertiesPrefs[field].push(getPref(params));
                        }
                    }
                    // email and groups are in one-to-one correspondence
                    if (field === 'email') {
                        mergedGroups[value as string] = group as string;
                    }
                }
            } else {
                // for the other contacts, keep only non-merged properties

                // but first prepare to change repeated groups
                // extract groups in contact to be merged
                const groups = contactProperties
                    .filter(({ field }) => field === 'email')
                    .map(({ value, group }) => ({ email: value, group }));
                // establish how groups should be changed
                const changeGroup = groups.reduce<{ [group: string]: string }>((acc, { email, group }) => {
                    if (Object.values(mergedGroups).includes(group as string)) {
                        const newGroup =
                            mergedGroups[email as string] || generateNewGroupName(Object.values(mergedGroups));
                        acc[group as string] = newGroup;
                        mergedGroups[email as string] = newGroup;
                    } else {
                        acc[group as string] = group as string;
                    }
                    return acc;
                }, {});

                for (const property of contactProperties) {
                    const { field, group, value, params } = property;
                    const newGroup = group ? changeGroup[group] : group;

                    if (!mergedProperties[field]) {
                        // an unseen property is directly merged
                        mergedContact.push({ ...property, params, group: newGroup });
                        mergedProperties[field] = [value];
                        if (hasPref(field)) {
                            mergedPropertiesPrefs[field] = [getPref(params)];
                        }
                        if (newGroup && field === 'email') {
                            mergedGroups[value as string] = newGroup;
                        }
                    } else {
                        // for properties already seen,
                        // check if there is a new value for it
                        const { isNewValue, newValue } = extractNewValue(value, field, mergedProperties[field]);
                        const newPref = hasPref(field) ? Math.max(...mergedPropertiesPrefs[field]) + 1 : undefined;
                        // check if the new value can be added
                        const canAdd =
                            field !== 'fn' && // Only keep the name of the first contact
                            (isCustomField(field) ||
                                [ONE_OR_MORE_MAY_BE_PRESENT, ONE_OR_MORE_MUST_BE_PRESENT].includes(
                                    PROPERTIES[field].cardinality
                                ));

                        if (isNewValue && canAdd) {
                            mergedContact.push({
                                ...property,
                                value: newValue,
                                group: newGroup,
                                params: {
                                    ...property.params,
                                    pref: String(newPref),
                                },
                            });
                            mergedProperties[field].push(newValue);
                            if (hasPref(field)) {
                                mergedPropertiesPrefs[field] = [newPref as number];
                            }
                            if (newGroup && field === 'email') {
                                mergedGroups[value as string] = newGroup;
                            }
                        }
                    }
                }
            }
            return acc;
        },
        {
            mergedContact: [],
            mergedProperties: {},
            mergedPropertiesPrefs: {},
            mergedGroups: {},
        }
    );

    return fromVCardProperties(mergedContact);
};
