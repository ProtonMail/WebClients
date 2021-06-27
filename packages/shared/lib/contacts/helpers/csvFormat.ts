import { capitalize, normalize } from '../../helpers/string';
import { ContactValue } from '../../interfaces/contacts';
import {
    Combine,
    Display,
    ParsedCsvContacts,
    PreVcardProperty,
    PreVcardsProperty,
} from '../../interfaces/contacts/Import';

// See './csv.ts' for the definition of pre-vCard and pre-vCards contact

// Csv properties to be ignored
const beIgnoredCsvProperties = [
    'name',
    'initials',
    'short name',
    'maiden name',
    'group membership',
    'mileage',
    'billing information',
    'directory server',
    'sensitivity',
    'priority',
    'subject',
];

const beIgnoredCsvPropertiesRegex = [
    /e-mail\s?([0-9]*) display name/, // We have to ignore 'E-mail Display Name' and 'E-mail [NUMBER] Display Name' headers
];

/**
 * For a list of headers and csv contacts extracted from a csv,
 * check if a given header index has the empty value for all contacts
 */
const isEmptyHeaderIndex = (index: number, contacts: string[][]) => !contacts.some((values) => values[index] !== '');

/**
 * Standarize a custom vcard type coming from a csv property
 * @param {String} csvType
 *
 * @return {String}
 */
const toVcardType = (csvType = '') => {
    const type = csvType.toLowerCase();

    switch (type) {
        case 'home':
            return 'home';
        case 'business':
            return 'work';
        case 'work':
            return 'work';
        case 'mobile':
            return 'cell';
        case 'cell':
            return 'cell';
        case 'other':
            return 'other';
        case 'main':
            return 'main';
        case 'primary':
            return 'main';
        case 'company main':
            return 'work';
        case 'pager':
            return 'pager';
        case 'home fax':
            return 'fax';
        case 'work fax':
            return 'fax';
        default:
            return '';
    }
};

/**
 * Given csv properties and csv contacts from any csv file, transform the properties
 * into csv properties from a standard outlook csv. Transform the contacts accordingly
 */
export const standarize = ({ headers, contacts }: ParsedCsvContacts) => {
    if (!contacts.length) {
        return;
    }

    // Vcard model does not allow multiple instances of these headers
    const uniqueHeaders = ['birthday', 'anniversary', 'gender'];
    const uniqueHeadersEncounteredStatusMap = new Map();
    uniqueHeaders.forEach((header) => uniqueHeadersEncounteredStatusMap.set(header, false));

    // do a first simple formatting of headers
    const formattedHeaders = headers.map((header) => header.replace('_', ' ').toLowerCase());

    // change name of certain headers into outlook equivalents
    // remove headers we are not interested in
    // merge headers 'xxx - type' and 'xxx - value' into one header
    const { beRemoved, beChanged } = formattedHeaders.reduce<{
        beRemoved: { [key: number]: boolean };
        beChanged: { [key: number]: string };
    }>(
        (acc, header, i) => {
            const { beRemoved, beChanged } = acc;
            const value = contacts[0][i];
            if (isEmptyHeaderIndex(i, contacts)) {
                beRemoved[i] = true;
            }
            if (
                beIgnoredCsvProperties.includes(header) ||
                header.startsWith('im') ||
                header.includes('event') ||
                beIgnoredCsvPropertiesRegex.some((regex) => regex.test(header))
            ) {
                beRemoved[i] = true;
                return acc;
            }
            // Remove header if we don't allow multiple instances and it has already been encountered
            if (uniqueHeaders.includes(header)) {
                if (!uniqueHeadersEncounteredStatusMap.get(header)) {
                    uniqueHeadersEncounteredStatusMap.set(header, true);
                } else {
                    beRemoved[i] = true;
                }
            }
            if (header === 'address') {
                beChanged[i] = 'street';
            }
            if (header === 'zip') {
                beChanged[i] = 'postal code';
            }
            if (header === 'county') {
                beChanged[i] = 'state';
            }
            /*
                consecutive headers for address n property are (n is an integer)
                * address n - type
                * address n - formatted
                * address n - street
                * address n - city
                * address n - PO box
                * address n - region
                * address n - postal code
                * address n - country
                * address n - extended address
                we have to drop the first two headers and change the rest accordingly
            */
            const addressMatch = header.match(/^address\s?\d+? - type$/);
            if (addressMatch) {
                const [, pref] = addressMatch;
                const n = pref || '';
                beRemoved[i] = true;
                beRemoved[i + 1] = true;
                beChanged[i + 2] = `${capitalize(toVcardType(value))} Street ${n}`.trim();
                beChanged[i + 3] = `${capitalize(toVcardType(value))} City ${n}`.trim();
                beChanged[i + 4] = `${capitalize(toVcardType(value))} PO Box ${n}`.trim();
                beChanged[i + 5] = `${capitalize(toVcardType(value))} State ${n}`.trim();
                beChanged[i + 6] = `${capitalize(toVcardType(value))} Postal Code ${n}`.trim();
                beChanged[i + 7] = `${capitalize(toVcardType(value))} Country/Region ${n}`.trim();
                beChanged[i + 8] = `${capitalize(toVcardType(value))} Extended Address ${n}`.trim();
                return acc;
            }
            /*
                consecutive headers for organization n property are (n is an integer)
                * organization n - type
                * organization n - name
                * organization n - yomi name
                * organization n - title
                * organization n - department
                * organization n - symbol
                * organization n - location
                * organization n - job description
                we can simply keep the name, title and department changing the corresponding header
            */
            const organizationMatch = header.match(/^organization\s?\d+? - (\w+)$/);
            if (organizationMatch) {
                const [, str] = organizationMatch;
                if (str === 'name') {
                    beChanged[i] = 'Company';
                } else if (str === 'title') {
                    beChanged[i] = 'Job Title';
                } else if (str === 'department') {
                    beChanged[i] = 'Department';
                } else if (str === 'job description') {
                    beChanged[i] = 'Role';
                } else {
                    beRemoved[i] = true;
                }
                return acc;
            }
            /*
                consecutive headers for generic property with type are
                * property - type
                * property - value
                we have to erase the first header and change the second one accordingly
            */
            const genericMatch = header.match(/(.*) - type$/i);
            if (genericMatch) {
                const [, property] = genericMatch;
                beRemoved[i] = true;
                beChanged[i + 1] = `${capitalize(toVcardType(value))} ${property}`.trim();
                return acc;
            }

            return acc;
        },
        { beRemoved: {}, beChanged: {} }
    );

    const enrichedHeaders = formattedHeaders
        .map((header, index) => {
            const original = headers[index];
            return { original, standard: beChanged[index] ? beChanged[index] : header };
        })
        .filter((_header, index) => !beRemoved[index]);

    const standardContacts = contacts.map((values) => values.filter((_value, j) => !beRemoved[j]));

    return { headers: enrichedHeaders, contacts: standardContacts };
};

interface TemplateArgs {
    header: string;
    value: ContactValue;
    index?: number;
    type?: string;
    pref?: number;
}

const templates = {
    fn({ header, value, index }: TemplateArgs) {
        return {
            header,
            value,
            checked: true,
            pref: 1,
            field: 'fn',
            type: 'main',
            combineInto: 'fn-main',
            combineIndex: index,
        };
    },
    fnYomi({ header, value, index }: TemplateArgs) {
        return {
            header,
            value,
            checked: true,
            pref: 2,
            field: 'fn',
            type: 'yomi',
            combineInto: 'fn-yomi',
            combineIndex: index,
        };
    },
    email({ pref, header, value, type }: TemplateArgs) {
        return {
            pref,
            header,
            value,
            checked: true,
            field: 'email',
            type,
            group: pref,
        };
    },
    tel({ pref, header, value, type }: TemplateArgs) {
        return {
            pref,
            header,
            value,
            checked: true,
            field: 'tel',
            type,
        };
    },
    adr({ pref, header, type, value, index }: TemplateArgs) {
        return {
            pref,
            header,
            value,
            checked: true,
            field: 'adr',
            type,
            combineInto: `adr-${type}`,
            combineIndex: index,
        };
    },
    org({ pref, header, value, index }: TemplateArgs) {
        return {
            pref,
            header,
            value,
            checked: true,
            field: 'org',
            combineInto: 'org',
            combineIndex: index,
        };
    },
};

/**
 * Given an object with a csv property name (header) in both original and standard form,
 * return a function that transforms a value for that property into one or several pre-vCard properties
 * @param {String} enrichedHeader.original
 * @param {String} enrichedHeader.standard
 *
 *
 * @return {Function}
 */
export const toPreVcard = ({ original, standard }: { original: string; standard: string }) => {
    const property = normalize(standard);
    const header = original;

    const companyMatch = property.match(/^company\s?(\d*)/);
    const departmentMatch = property.match(/^department\s?(\d*)/);
    const emailMatch = property.match(/^(\w+)?\s?e-?mail\s?(\d*)/);
    const phoneMatch = property.match(/^(\w+\s*\w+)?\s?phone\s?(\d*)$/);
    const faxMatch = property.match(/^(\w+)?\s?fax\s?(\d*)$/);
    const pagerMatch = property.match(/^(\w+)?\s?pager\s?(\d*)$/);
    const telexMatch = property.match(/^callback|telex\s?(\d*)$/);
    const poBoxMatch = property.match(/^(\w*)\s?po box\s?(\d*)$/);
    const extAddressMatch = property.match(/^(\w*)\s?extended address\s?(\d*)$/);
    const streetMatch = property.match(/^(\w*)\s?street\s?(\d*)$/);
    const cityMatch = property.match(/^(\w*)\s?city\s?(\d*)$/);
    const stateMatch = property.match(/^(\w*)\s?state\s?(\d*)$/);
    const postalCodeMatch = property.match(/^(\w*)\s?postal code\s?(\d*)$/);
    const countryMatch = property.match(/^(\w*)\s?country\s?(\d*)$/);

    if (['title', 'name prefix'].includes(property)) {
        return (value: ContactValue) => [templates.fn({ header, value, index: 0 })];
    }
    if (['first name', 'given name'].includes(property)) {
        return (value: ContactValue) => [templates.fn({ header, value, index: 1 })];
    }
    if (['middle name', 'additional name'].includes(property)) {
        return (value: ContactValue) => [templates.fn({ header, value, index: 2 })];
    }
    if (['last name', 'family name'].includes(property)) {
        return (value: ContactValue) => [templates.fn({ header, value, index: 3 })];
    }
    if (['suffix', 'name suffix'].includes(property)) {
        return (value: ContactValue) => [templates.fn({ header, value, index: 4 })];
    }
    if (['given yomi', 'given name yomi'].includes(property)) {
        return (value: ContactValue) => templates.fnYomi({ header, value, index: 0 });
    }
    if (['middle name yomi', 'additional name yomi'].includes(property)) {
        return (value: ContactValue) => templates.fnYomi({ header, value, index: 1 });
    }
    if (['surname yomi', 'family name yomi'].includes(property)) {
        return (value: ContactValue) => templates.fnYomi({ header, value, index: 2 });
    }
    if (companyMatch) {
        const pref = companyMatch[1] ? +companyMatch[1] : undefined;
        return (value: ContactValue) => templates.org({ pref, header, value, index: 0 });
    }
    if (departmentMatch) {
        const pref = departmentMatch[1] ? +departmentMatch[1] : undefined;
        return (value: ContactValue) => templates.org({ pref, header, value, index: 1 });
    }
    if (emailMatch) {
        const type = emailMatch[1] ? emailMatch[1] : undefined;
        const pref = emailMatch?.[2] ? +emailMatch[2] : undefined;
        return (value: ContactValue) => templates.email({ pref, header, value, type: type ? toVcardType(type) : '' });
    }
    if (phoneMatch) {
        const type = phoneMatch[1] ? phoneMatch[1] : undefined;
        const pref = phoneMatch?.[2] ? +phoneMatch[2] : undefined;
        return (value: ContactValue) => templates.tel({ pref, header, value, type: type ? toVcardType(type) : '' });
    }
    if (faxMatch) {
        const pref = faxMatch?.[2] ? +faxMatch[2] : undefined;
        return (value: ContactValue) => templates.tel({ pref, header, value, type: 'fax' });
    }
    if (pagerMatch) {
        const pref = pagerMatch?.[2] ? +pagerMatch[2] : undefined;
        return (value: ContactValue) => templates.tel({ pref, header, value, type: 'pager' });
    }
    if (telexMatch) {
        const pref = telexMatch[1] ? +telexMatch[1] : undefined;
        return (value: ContactValue) => templates.tel({ pref, header, value, type: 'other' });
    }
    if (poBoxMatch) {
        const type = poBoxMatch[1] ? poBoxMatch[1] : undefined;
        const pref = poBoxMatch?.[2] ? +poBoxMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 0 });
    }
    if (extAddressMatch) {
        const type = extAddressMatch[1] ? extAddressMatch[1] : undefined;
        const pref = extAddressMatch?.[2] ? +extAddressMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 1 });
    }
    if (streetMatch) {
        const type = streetMatch[1] ? streetMatch[1] : undefined;
        const pref = streetMatch?.[2] ? +streetMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 2 });
    }
    if (cityMatch) {
        const type = cityMatch[1] ? cityMatch[1] : undefined;
        const pref = cityMatch?.[2] ? +cityMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 3 });
    }
    if (stateMatch) {
        const type = stateMatch[1] ? stateMatch[1] : undefined;
        const pref = stateMatch?.[2] ? +stateMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 4 });
    }
    if (postalCodeMatch) {
        const type = postalCodeMatch[1] ? postalCodeMatch[1] : undefined;
        const pref = postalCodeMatch?.[2] ? +postalCodeMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 5 });
    }
    if (countryMatch) {
        const type = countryMatch[1] ? countryMatch[1] : undefined;
        const pref = countryMatch?.[2] ? +countryMatch[2] : undefined;
        return (value: ContactValue) => templates.adr({ pref, header, type: toVcardType(type), value, index: 6 });
    }
    if (property === 'job title') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'title',
        });
    }
    if (property === 'role') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'role',
        });
    }
    if (property === 'birthday') {
        return (value: ContactValue) => {
            return {
                header,
                value,
                checked: true,
                field: 'bday',
            };
        };
    }
    if (property === 'anniversary') {
        return (value: ContactValue) => {
            return {
                header,
                value,
                checked: true,
                field: 'anniversary',
            };
        };
    }
    if (property.includes('web')) {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'url',
        });
    }
    if (property === 'photo') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'photo',
        });
    }
    if (property === 'logo') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'logo',
        });
    }
    if (property === 'location') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'geo',
            type: 'main',
        });
    }
    if (property === 'office location') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'geo',
            type: 'work',
        });
    }
    if (property === 'gender') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'gender',
        });
    }
    if (property === 'timezone') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'tz',
        });
    }
    if (property === 'organization') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'org',
        });
    }
    if (property === 'language') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'lang',
        });
    }
    if (property === 'notes' || property.includes('custom field')) {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'note',
        });
    }
    if (property === 'categories') {
        return (value: ContactValue) => ({
            header,
            value,
            checked: true,
            field: 'categories',
        });
    }

    // convert any other property into custom note
    return (value: ContactValue) => ({
        header,
        value,
        checked: true,
        field: 'note',
        custom: true,
    });
};

/**
 * When there is only one pre-vCard property in a pre-vCards property, get the property
 */
const getFirstValue = (preVcards: PreVcardProperty[]): string =>
    (preVcards[0].checked ? preVcards[0].value : '') as string;

/**
 * This object contains the functions that must be used when combining pre-vCard properties into
 * vCard ones. The keys correspond to the field of the pre-vCards to be combined.
 */
export const combine: Combine = {
    fn(preVcards: PreVcardsProperty) {
        return preVcards.reduce((acc, { value, checked }) => (value && checked ? `${acc} ${value}` : acc), '').trim();
    },
    adr(preVcards: PreVcardsProperty) {
        const propertyADR = new Array(7).fill('');
        preVcards.forEach(({ value, checked, combineIndex }) => {
            if (checked) {
                propertyADR[combineIndex || 0] = value;
            }
        });
        return propertyADR;
    },
    org(preVcards: PreVcardsProperty) {
        const propertyORG: string[] = new Array(2).fill('');
        preVcards.forEach(({ value, checked, combineIndex }) => {
            if (checked) {
                propertyORG[combineIndex || 0] = value as string;
            }
        });
        return propertyORG.filter(Boolean).join(';');
    },
    categories(preVcards: PreVcardsProperty) {
        // we can get several categories separated by ';'
        return getFirstValue(preVcards).split(';');
    },
    email: getFirstValue,
    tel: getFirstValue,
    photo: getFirstValue,
    bday: getFirstValue,
    anniversary: getFirstValue,
    title: getFirstValue,
    role: getFirstValue,
    note: getFirstValue,
    url: getFirstValue,
    gender: getFirstValue,
    lang: getFirstValue,
    tz: getFirstValue,
    geo: getFirstValue,
    logo: getFirstValue,
    member: getFirstValue,
    custom(preVcards: PreVcardsProperty) {
        const { checked, header, value } = preVcards[0];
        return checked && value ? `${header}: ${getFirstValue(preVcards)}` : '';
    },
};

/**
 * Because the value of a vCard property is not always a string (sometimes it is an array),
 * we need an additional function that combines the csv properties into a string to be displayed.
 * This object contains the functions that take an array of pre-vCards properties to be combined
 * and returns the value to be displayed. The keys correspond to the field of the pre-vCards to be combined.
 */
export const display: Display = {
    fn(preVcards: PreVcardsProperty) {
        return preVcards.reduce((acc, { value, checked }) => (value && checked ? `${acc} ${value}` : acc), '').trim();
    },
    adr(preVcards: PreVcardsProperty) {
        const propertyADR = new Array(7).fill('');
        preVcards.forEach(({ value, checked, combineIndex }) => {
            if (checked) {
                propertyADR[combineIndex || 0] = value;
            }
        });
        return propertyADR.filter(Boolean).join(', ');
    },
    org(preVcards: PreVcardsProperty) {
        const propertyORG = new Array(2).fill('');
        preVcards.forEach(({ value, checked, combineIndex }) => {
            if (checked) {
                propertyORG[combineIndex || 0] = value;
            }
        });
        return propertyORG.filter(Boolean).join('; ');
    },
    email: getFirstValue,
    tel: getFirstValue,
    photo: getFirstValue,
    bday: getFirstValue,
    anniversary: getFirstValue,
    title: getFirstValue,
    role: getFirstValue,
    note: getFirstValue,
    url: getFirstValue,
    gender: getFirstValue,
    lang: getFirstValue,
    tz: getFirstValue,
    geo: getFirstValue,
    logo: getFirstValue,
    member: getFirstValue,
    categories: getFirstValue,
    custom(preVcards: PreVcardsProperty) {
        const { header, value, checked } = preVcards[0];
        return checked && value ? `${header}: ${getFirstValue(preVcards)}` : '';
    },
};
