import { format, parseISO } from 'date-fns';
import ICAL from 'ical.js';

import isTruthy from '@proton/utils/isTruthy';
import range from '@proton/utils/range';

import { isValidDate } from '../date/date';
import { readFileAsString } from '../helpers/file';
import type {
    VCardAddress,
    VCardContact,
    VCardDateOrText,
    VCardGenderValue,
    VCardOrg,
    VCardProperty,
    VcardNValue,
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

const getArrayStringValue = (value: undefined | string | string[]) => {
    if (!value) {
        return [''];
    }
    if (!Array.isArray(value)) {
        return [value];
    }
    return value;
};

export const isValidDateValue = (dateOrText?: VCardDateOrText): dateOrText is { date: Date } => {
    return Boolean(dateOrText && 'date' in dateOrText && dateOrText.date && isValidDate(dateOrText.date));
};

export const isDateTextValue = (dateOrText?: VCardDateOrText): dateOrText is { text: string } => {
    return Boolean(dateOrText && 'text' in dateOrText && dateOrText.text);
};

export const icalValueToNValue = (value: string | string[]): VcardNValue => {
    // According to vCard RFC https://datatracker.ietf.org/doc/html/rfc6350#section-6.2.2
    // N is split into 5 strings or string arrays with different meaning at each position
    if (Array.isArray(value)) {
        const [familyNames, givenNames, additionalNames, honorificPrefixes, honorificSuffixes] = value;

        return {
            familyNames: getArrayStringValue(familyNames),
            givenNames: getArrayStringValue(givenNames),
            additionalNames: getArrayStringValue(additionalNames),
            honorificPrefixes: getArrayStringValue(honorificPrefixes),
            honorificSuffixes: getArrayStringValue(honorificSuffixes),
        };
    }

    return {
        familyNames: [value],
        givenNames: [''],
        additionalNames: [''],
        honorificPrefixes: [''],
        honorificSuffixes: [''],
    };
};

export const icalValueToOrgValue = (value: string | string[]): VCardOrg => {
    /**
     * According to vCard RFC https://datatracker.ietf.org/doc/html/rfc6350#section-6.6.4
     * ORG can be split into several strings. First one is always `organization name`, following ones are `organizational unit names`
     */
    if (Array.isArray(value)) {
        const [organizationalName, ...organizationalUnitNames] = value;

        return {
            organizationalName,
            ...(organizationalUnitNames.length
                ? { organizationalUnitNames: getArrayStringValue(organizationalUnitNames) }
                : {}),
        };
    }

    return {
        organizationalName: value,
    };
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

    if (name === 'n') {
        return icalValueToNValue(value);
    }
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
    if (name === 'org') {
        return icalValueToOrgValue(value);
    }
    if (['x-pm-encrypt', 'x-pm-encrypt-untrusted', 'x-pm-sign'].includes(name)) {
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

    // Here, "type" refers to the vCard value type (e.g. "text", "uri", "date"),
    // not the TYPE parameter (e.g. "home", "work", "cell").
    // If the imported value type is different from the property's default, we need to update it
    if (!isDefaultType) {
        result.value = type;
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

    const vCardContact = {} as VCardContact;

    properties.forEach((property) => {
        parseIcalProperty(property, vCardContact);
    });

    return vCardContact;
};

export const internalValueToIcalValue = (name: string, value: any) => {
    if (name === 'n') {
        const {
            familyNames = [''],
            givenNames = [''],
            additionalNames = [''],
            honorificPrefixes = [''],
            honorificSuffixes = [''],
        } = value;

        return [familyNames, givenNames, additionalNames, honorificPrefixes, honorificSuffixes];
    }

    if (name === 'adr') {
        const {
            postOfficeBox = '',
            extendedAddress = '',
            streetAddress = '',
            locality = '',
            region = '',
            postalCode = '',
            country = '',
        } = value;
        return [postOfficeBox, extendedAddress, streetAddress, locality, region, postalCode, country];
    }

    if (name === 'bday' || name === 'anniversary') {
        const dateValue: VCardDateOrText = value;
        if (isValidDateValue(dateValue)) {
            //  As we don't allow to edit times, we assume there's no need of keeping the time part
            return format(dateValue.date, 'yyyyMMdd');
        } else if (isDateTextValue(dateValue)) {
            return dateValue.text;
        } else {
            return '';
        }
    }

    if (name === 'gender') {
        const genderValue: VCardGenderValue = value;
        return genderValue.text || '';
    }

    if (name === 'org') {
        const orgValue: VCardOrg = value;
        const { organizationalName, organizationalUnitNames = [] } = orgValue;
        return [...(organizationalName ? [organizationalName] : []), ...organizationalUnitNames];
    }

    return value;
};

// TODO: Deprecate this function. See VcardProperty interface
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

        if (['bday', 'anniversary'].includes(field)) {
            if (!isValidDateValue(value)) {
                property.resetType('text');
            }
        }

        const iCalValue = internalValueToIcalValue(field, value);
        property.setValue(iCalValue);

        Object.entries(params || {}).forEach(([key, value]) => {
            property.setParameter(key, value.toString());
        });

        component.addProperty(property);
    });

    return component;
};

const getProperty = (name: keyof VCardContact, { value, params = {}, group }: any) => {
    if (!value) {
        return;
    }

    const nameWithGroup = [group, name].filter(isTruthy).join('.');
    const property = new ICAL.Property(nameWithGroup);

    if (['bday', 'anniversary'].includes(name) && !(value.date && isValidDate(value.date))) {
        property.resetType('text');
    }

    if (property.isMultiValue && Array.isArray(value)) {
        property.setValues(value.map((val) => internalValueToIcalValue(name, val)));
    } else {
        property.setValue(internalValueToIcalValue(name, value));
    }

    Object.keys(params).forEach((key) => {
        property.setParameter(key, params[key]);
    });

    return property;
};

export const serialize = (contact: VCardContact) => {
    const icalComponent = new ICAL.Component('vcard');

    // clear any possible previous version (which could be < 4.0)
    delete contact.version;
    const versionProperty = new ICAL.Property('version');
    versionProperty.setValue('4.0');
    icalComponent.addProperty(versionProperty);

    // Prefer to put FN at the beginning (not required by RFC)
    const sortedObjectKeys = Object.keys(contact).sort((property1, property2) => {
        if (property1 === 'fn') {
            return -1;
        } else if (property2 === 'fn') {
            return 1;
        } else {
            return 0;
        }
    }) as (keyof VCardContact)[];

    sortedObjectKeys.forEach((name) => {
        const jsonProperty = contact[name];

        if (Array.isArray(jsonProperty)) {
            jsonProperty.forEach((property) => {
                const data = getProperty(name, property);
                if (!data) {
                    return;
                }

                icalComponent.addProperty(data);
            });
            return;
        }

        const data = getProperty(name, jsonProperty);

        if (!data) {
            return;
        }

        icalComponent.addProperty(data);
    });

    return icalComponent.toString();
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

export const getContactHasName = (contact: VCardContact) => {
    return !!contact.fn?.[0]?.value;
};
