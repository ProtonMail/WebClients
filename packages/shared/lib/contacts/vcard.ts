import ICAL from 'ical.js';
import { readFileAsString } from '../helpers/file';
import isTruthy from '../helpers/isTruthy';
import { ContactProperties, ContactProperty } from '../interfaces/contacts';
import { addPref, hasPref, sortByPref } from './properties';
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
    caluri: { cardinality: ONE_OR_MORE_MAY_BE_PRESENT }
};

export const isCustomField = (field = '') => field.startsWith('x-');

/**
 * Parse vCard string and return contact properties model as an array
 */
export const parse = (vcard = ''): ContactProperties => {
    const comp = new ICAL.Component(ICAL.parse(vcard));
    const properties = comp.getAllProperties() as any[];

    const sortedProperties = properties
        .reduce<ContactProperty[]>((acc, property) => {
            const splitProperty = property.name.split('.');
            const field = splitProperty[1] ? splitProperty[1] : splitProperty[0];
            const type = property.getParameter('type');
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
            const prop = { pref, field, group, type, value: getValue(property) };

            acc.push(prop);

            return acc;
        }, [])
        .sort(sortByPref);
    // make sure properties that require a pref have a pref
    return addPref(sortedProperties);
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
        property.setValue(value);
        type && property.setParameter('type', type);
        pref && property.setParameter('pref', '' + pref);
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
    const vcards = vcf.split('END:VCARD');
    vcards.pop();
    return vcards.map((vcard) => vcard.trim() + '\r\nEND:VCARD');
};
