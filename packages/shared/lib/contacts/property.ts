import { range } from '../helpers/array';

const UNESCAPE_REGEX = /\\\\|\\,|\\;/gi;
const UNESCAPE_EXTENDED_REGEX = /\\\\|\\:|\\,|\\;/gi;
const BACKSLASH_SEMICOLON_REGEX = /\\;/gi;
const ANIMALS = '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼';
const SPECIAL_CHARACTER_REGEX = /🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼/gi;

/**
 * Unescape a vcard value (with \).
 * If extended is a Boolean === true, we can unescape : too.
 * ex: for a base64
 */
export const unescapeVcardValue = (value = '', extended = false) => {
    // If we do map(unescapeValue) we still want the default unescape
    const reg = extended !== true ? UNESCAPE_REGEX : UNESCAPE_EXTENDED_REGEX;
    return value.replace(reg, (val) => val.substr(1));
};

/**
 * To avoid problem with the split on ; we need to replace \; first and then re-inject the \;
 * There is no negative lookbehind in JS regex
 * See https://github.com/ProtonMail/Angular/issues/6298
 */
export const cleanMultipleValue = (value: string = '') => {
    return value
        .replace(BACKSLASH_SEMICOLON_REGEX, ANIMALS)
        .split(';')
        .map((value) => value.replace(SPECIAL_CHARACTER_REGEX, '\\;'))
        .map((value) => unescapeVcardValue(value));
};

/**
 * ICAL library can crash if the value saved in the vCard is improperly formatted
 * If it crash we get the raw value from jCal key
 */
const getRawValues = (property: any): string[] => {
    try {
        return property.getValues();
    } catch (error) {
        const [, , , value = ''] = property.jCal || [];
        return [value];
    }
};

/**
 * Get the value of an ICAL property
 *
 * @return currently an array for the fields adr and categories, a string otherwise
 */
export const getValue = (property: any, field: string): string | string[] => {
    const values = getRawValues(property).map((val: string | string[] | Date) => {
        // adr
        if (Array.isArray(val)) {
            return val;
        }

        if (typeof val === 'string') {
            return val;
        }

        // date
        return val.toString();
    });

    // In some rare situations, ICAL can miss the multiple value nature of an 'adr' or 'org' field
    // It has been reproduced after a contact import from iOS including the address in a group
    // For that specific case, we have to split values manually
    if ((field === 'adr' || field === 'org') && typeof values[0] === 'string') {
        return cleanMultipleValue(values[0]);
    }

    // If one of the adr or org sections contains unescaped `,`
    // ICAL will return a value of type (string | string[])[]
    // Which we don't support later in the code
    // Until we do, we flatten the value by joining these entries
    if (field === 'adr' || field === 'org') {
        values[0] = (values[0] as (string | string[])[]).map((entry) =>
            Array.isArray(entry) ? entry.join(', ') : entry
        );
    }

    if (field === 'categories') {
        // the ICAL library will parse item1.CATEGORIES:cat1,cat2 with value ['cat1,cat2'], but we expect ['cat1', 'cat2']
        const flatValues = values.flat();
        const splitValues = flatValues.map((value) => value.split(','));
        return splitValues.flat();
    }
    return values[0];
};

/**
 * Transform a custom type starting with 'x-' into normal type
 */
export const clearType = (type = ''): string => type.toLowerCase().replace('x-', '');

/**
 * Given types in an array, return the first type. If types is a string already, return it
 */
export const getType = (types: string | string[] = []): string => {
    if (Array.isArray(types)) {
        if (!types.length) {
            return '';
        }
        return types[0];
    }
    return types;
};

/**
 * Sanitize a string or string-array value for the field 'adr' into an array of strings to be displayed on different lines
 */
export const formatAdr = (adr: string | string[]): string[] => {
    let value: string[] = [];
    try {
        // Input sanitization
        value = Array.isArray(adr) ? adr : [adr];
        if (value.length < 7) {
            value.push(...range(0, 7 - value.length).map(() => ''));
        }

        const filterEmpty = (source: string[]) => source.filter((line) => line !== undefined && line !== '');

        // According to vCard RFC https://datatracker.ietf.org/doc/html/rfc6350#section-6.3.1
        // Address is split into 7 strings with different meaning at each position
        const [postOfficeBox, extendedAddress, streetAddress, locality, region, postalCode, country] = adr;
        const lines = filterEmpty([
            streetAddress,
            extendedAddress,
            filterEmpty([postalCode, locality]).join(', '),
            postOfficeBox,
            filterEmpty([region, country]).join(', '),
        ]);
        return lines;
    } catch {
        // Some addresses, especially imported can be strangely formated
        // We don't want to break the whole page if the format is corrupted
        return value;
    }
};
