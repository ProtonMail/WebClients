import { formatISO, parseISO } from 'date-fns';
import ICAL from 'ical.js';

import isTruthy from '@proton/utils/isTruthy';
import range from '@proton/utils/range';

import { isValidDate } from '../date/date';
import { readFileAsString } from '../helpers/file';
import {
    VCardAddress,
    VCardContact,
    VCardDateOrText,
    VCardGenderValue,
    VCardProperty,
} from '../interfaces/contacts/VCard';
import { getMimeTypeVcard, getPGPSchemeVcard } from './keyProperties';
import { createContactPropertyUid, getStringContactValue } from './properties';
import { getValue } from './property';

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

    // If we encounter an array value for a field, if it contains only an empty string,
    // we don't want it to be part on contact properties.
    // E.g. we have "CATEGORIES:" (with nothing before nor behind) in the vCard
    //  => We need to remove it otherwise the contact will not be exportable because "toString" will fail
    if (Array.isArray(propertyAsObject.value)) {
        if (propertyAsObject.value.filter((element) => element !== '').length === 0) {
            return;
        }
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
        return [postOfficeBox, extendedAddress, streetAddress, locality, region, postalCode, country];
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

        if (['bday', 'anniversary'].includes(field) && !(value.date && isValidDate(value.date))) {
            property.resetType('text');
        }

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
