import ICAL from 'ical.js';
import isTruthy from '@proton/utils/isTruthy';
import range from '@proton/utils/range';
import { formatISO, parseISO } from 'date-fns';
import { isValidDate } from '../date/date';
import { readFileAsString } from '../helpers/file';
import { ContactProperties, ContactProperty } from '../interfaces/contacts';
import { addPref, createContactPropertyUid, getStringContactValue, hasPref, sortByPref } from './properties';
import { getValue } from './property';
import {
    VCardAddress,
    VCardContact,
    VCardDateOrText,
    VCardGenderValue,
    VCardProperty,
} from '../interfaces/contacts/VCard';
import { getMimeTypeVcard, getPGPSchemeVcard } from './keyProperties';

export const ONE_OR_MORE_MUST_BE_PRESENT = '1*';
export const EXACTLY_ONE_MUST_BE_PRESENT = '1';
export const EXACTLY_ONE_MAY_BE_PRESENT = '*1';
export const ONE_OR_MORE_MAY_BE_PRESENT = '*';

export const PROPERTIES: { [key: string]: { cardinality: string } } = {
    fn: { cardinality: ONE_OR_MORE_MUST_BE_PRESENT },
    n: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    nickname: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    photo: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    bday: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    anniversary: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    gender: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    adr: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    tel: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    email: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    impp: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    lang: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    tz: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    geo: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    title: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    role: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    logo: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    org: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    member: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    related: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    categories: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    note: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    prodid: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    rev: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    sound: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    uid: { cardinality: EXACTLY_ONE_MAY_BE_PRESENT },
    clientpidmap: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    url: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    version: { cardinality: EXACTLY_ONE_MUST_BE_PRESENT },
    key: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    fburl: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    caladruri: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
    caluri: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT },
};

export const isMultiValue = (field = '') => {
    const { cardinality = ONE_OR_MORE_MAY_BE_PRESENT } = PROPERTIES[field] || {};
    return [ONE_OR_MORE_MUST_BE_PRESENT, ONE_OR_MORE_MAY_BE_PRESENT].includes(cardinality);
};

export const isDateType = (type = '') => {
    return (
        type === 'date' ||
        type === 'time' ||
        type === 'date-time' ||
        type === 'date-and-or-time' ||
        type === 'timestamp'
    );
};

export const isCustomField = (field = '') => field.startsWith('x-');

/**
 * Parse vCard string and return contact properties model as an array
 */
export const parse = (vcard = ''): ContactProperties => {
    const comp = new ICAL.Component(ICAL.parse(vcard));
    const properties = comp.getAllProperties() as any[];

    // Apple AddressBook can add custom headers 'X-ABLabel' to properties that we need to take care of
    const customHeaders = properties.reduce<{ name: string; value: string }[]>((acc, property) => {
        if (property.name.includes('x-ablabel')) {
            const [propertyName, propertyField]: [string, string | undefined] = property.name.split('.');
            const field = propertyField && propertyField.length > 0 ? propertyField : propertyName;
            const value = getValue(property, field);
            if (typeof value === 'string') {
                return [...acc, { name: propertyName, value }];
            }
            return acc;
        }
        return acc;
    }, []);

    const sortedProperties = properties
        .reduce<ContactProperty[]>((acc, property) => {
            const splitProperty = property.name.split('.');
            const field = splitProperty[1] ? splitProperty[1] : splitProperty[0];
            const customType = customHeaders.find((header) => header.name === splitProperty[0]);
            const type = customType ? customType.value : property.getParameter('type');
            const prefValue = property.getParameter('pref');
            const pref = typeof prefValue === 'string' && hasPref(field) ? +prefValue : undefined;

            // Ignore invalid field
            if (!field) {
                return acc;
            }

            const isCustom = isCustomField(field);

            // Ignore invalid property
            if (!isCustom && !Object.keys(PROPERTIES).includes(field)) {
                return acc;
            }

            const group = splitProperty[1] ? splitProperty[0] : undefined;
            const prop = { pref, field, group, type, value: getValue(property, field) };

            acc.push(prop);

            return acc;
        }, [])
        .sort(sortByPref);
    // make sure properties that require a pref have a pref
    return addPref(sortedProperties);
};

export const icalValueToInternalAddress = (adr: string | string[]): VCardAddress => {
    // Input sanitization
    const value = (Array.isArray(adr) ? adr : [adr]).map((entry) => getStringContactValue(entry));
    if (value.length < 7) {
        value.push(...range(0, 7 - value.length).map(() => ''));
    }

    // According to vCard RFC https://datatracker.ietf.org/doc/html/rfc6350#section-6.3.1
    // Address is split into 7 strings with different meaning at each position
    const [postOfficeBox, extendedAddress, streetAddress, locality, region, postalCode, country] = value;
    return {
        postOfficeBox,
        extendedAddress,
        streetAddress,
        locality,
        region,
        postalCode,
        country,
    };
};

/**
 * Convert from ical.js format to an internal format
 */
export const icalValueToInternalValue = (name: string, type: string, property: any) => {
    const value = getValue(property, name) as string | string[];

    if (name === 'adr') {
        return icalValueToInternalAddress(value);
    }
    if (name === 'bday' || name === 'anniversary') {
        if (isDateType(type)) {
            return { date: parseISO(value.toString()) };
        } else {
            return { text: value.toString() };
        }
    }
    if (name === 'gender') {
        return { text: value.toString() };
    }
    if (name === 'x-pm-encrypt' || name === 'x-pm-sign') {
        return value === 'true';
    }
    if (name === 'x-pm-scheme') {
        return getPGPSchemeVcard(value as string);
    }
    if (name === 'x-pm-mimetype') {
        return getMimeTypeVcard(value as string);
    }
    if (Array.isArray(value)) {
        return value.map((value) => {
            return value;
        });
    }
    if (isDateType(type)) {
        return parseISO(value);
    }
    return value;
};

const getParameters = (type: string, property: any) => {
    const allParameters = property.toJSON() || [];
    const parameters = allParameters[1];
    const isDefaultType = type === property.getDefaultType();

    const result = {
        ...parameters,
    };

    if (!isDefaultType) {
        result.type = type;
    }

    return result;
};

const parseIcalProperty = (property: any, vCardContact: VCardContact) => {
    const { name: nameWithGroup } = property;

    if (!nameWithGroup) {
        return;
    }

    const [group, name]: [string | undefined, keyof VCardContact] = nameWithGroup.includes('.')
        ? nameWithGroup.split('.')
        : [undefined, nameWithGroup];

    const { type } = property;
    const value = icalValueToInternalValue(name, type, property);

    const params = getParameters(type, property);
    const propertyAsObject = {
        field: name,
        value,
        uid: createContactPropertyUid(),
        ...(Object.keys(params).length && { params }),
        ...(group ? { group } : {}),
    };

    if (!isMultiValue(name)) {
        vCardContact[name] = propertyAsObject as any;
        return;
    }

    if (!vCardContact[name]) {
        vCardContact[name] = [] as any;
    }

    (vCardContact[name] as any[]).push(propertyAsObject);
};

export const parseToVCard = (vcard: string): VCardContact => {
    const icalComponent = new ICAL.Component(ICAL.parse(vcard));
    const properties = icalComponent.getAllProperties() as any[];

    const vCardContact: VCardContact = { fn: [] };

    properties.forEach((property) => {
        parseIcalProperty(property, vCardContact);
    });

    return vCardContact;
};

export const internalValueToIcalValue = (name: string, type: string | undefined, value: any) => {
    if (name === 'adr') {
        const {
            postOfficeBox = '',
            extendedAddress = '',
            streetAddress = '',
            locality = '',
            region = '',
            postalCode = '',
            country = '',
        } = value as VCardAddress;
        return [[postOfficeBox, extendedAddress, streetAddress, locality, region, postalCode, country]];
    }
    if (name === 'bday' || name === 'anniversary') {
        const dateValue = value as VCardDateOrText;
        if (dateValue?.date && isValidDate(dateValue.date)) {
            return formatISO(dateValue.date, { representation: 'date' });
        } else {
            return dateValue.text || '';
        }
    }
    if (name === 'gender') {
        const genderValue = value as VCardGenderValue;
        return genderValue.text || '';
    }
    return value;
};

export const vCardPropertiesToICAL = (properties: VCardProperty[]) => {
    // make sure version (we enforce 4.0) is the first property; otherwise invalid vcards can be generated
    const versionLessProperties = properties.filter(({ field }) => field !== 'version');

    const component = new ICAL.Component('vcard');
    const versionProperty = new ICAL.Property('version');
    versionProperty.setValue('4.0');
    component.addProperty(versionProperty);

    versionLessProperties.forEach(({ field, params, value, group }) => {
        const fieldWithGroup = [group, field].filter(isTruthy).join('.');
        const property = new ICAL.Property(fieldWithGroup);

        const iCalValue = internalValueToIcalValue(field, params?.type, value);
        property.setValue(iCalValue);

        Object.entries(params || {}).forEach(([key, value]) => {
            property.setParameter(key, value.toString());
        });

        component.addProperty(property);
    });

    return component;
};

/**
 * Parse contact properties to create a ICAL vcard component
 */
export const toICAL = (properties: ContactProperties = []) => {
    // make sure version (we enforce 4.0) is the first property; otherwise invalid vcards can be generated
    const versionLessProperties = properties.filter(({ field }) => field !== 'version');

    const comp = new ICAL.Component('vcard');
    const versionProperty = new ICAL.Property('version');
    versionProperty.setValue('4.0');
    comp.addProperty(versionProperty);

    return versionLessProperties.reduce((component, { field, type, pref, value, group }) => {
        const fieldWithGroup = [group, field].filter(isTruthy).join('.');
        const property = new ICAL.Property(fieldWithGroup);

        if (['bday', 'anniversary'].includes(field) && typeof value === 'string' && !isValidDate(parseISO(value))) {
            property.resetType('text');
        }

        property.setValue(value);

        if (type) {
            property.setParameter('type', type);
        }
        if (pref) {
            property.setParameter('pref', `${pref}`);
        }
        component.addProperty(property);
        return component;
    }, comp);
};

/**
 * Merge multiple contact properties. Order matters
 */
export const merge = (contacts: ContactProperties[] = []): ContactProperties => {
    return contacts.reduce((acc, properties) => {
        properties.forEach((property) => {
            const { field } = property;
            const { cardinality = ONE_OR_MORE_MAY_BE_PRESENT } = PROPERTIES[field] || {};

            if ([ONE_OR_MORE_MUST_BE_PRESENT, ONE_OR_MORE_MAY_BE_PRESENT].includes(cardinality)) {
                acc.push(property);
            } else if (!acc.find(({ field: f }) => f === field)) {
                acc.push(property);
            }
        });
        return acc;
    }, []);
};

/**
 * Basic test for the validity of a vCard file read as a string
 */
const isValid = (vcf = ''): boolean => {
    const regexMatchBegin = vcf.match(/BEGIN:VCARD/g);
    const regexMatchEnd = vcf.match(/END:VCARD/g);
    if (!regexMatchBegin || !regexMatchEnd) {
        return false;
    }
    return regexMatchBegin.length === regexMatchEnd.length;
};

/**
 * Read a vCard file as a string. If there are errors when parsing the csv, throw
 */
export const readVcf = async (file: File): Promise<string> => {
    const vcf = await readFileAsString(file);
    if (!isValid(vcf)) {
        throw new Error('Error when reading vcf file');
    }
    return vcf;
};

/**
 * Extract array of vcards from a string containing several vcards
 */
export const extractVcards = (vcf = ''): string[] => {
    const strippedEndVcards = vcf.split('END:VCARD');
    return strippedEndVcards.filter((line) => isTruthy(line.trim())).map((vcard) => `${vcard}END:VCARD`.trim());
};
