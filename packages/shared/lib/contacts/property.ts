import { isValid, parseISO } from 'date-fns';

import { VCardDateOrText, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ContactValue } from '../interfaces/contacts';

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
    return value.replace(reg, (val) => val.substring(1));
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
    } catch (error: any) {
        const [, , , value = ''] = property.jCal || [];
        return [value];
    }
};

/**
 * Get the value of an ICAL property
 *
 * @return currently an array for the fields adr and categories, a string otherwise
 */
export const getValue = (property: any, field: string): ContactValue => {
    const values = getRawValues(property).map((val: string | string[] | Date) => {
        /*
            To avoid unintended CRLF sequences inside the values of vCard address fields (those are interpreted as field separators unless followed by a space), we sanitize string values
            ICAL.parse transforms the first occurence of \\r\\n in \\r\n, so we need to sanitize both \\r\n and \\r\\n
         */
        const sanitizeStringValue = (value: string) =>
            value.replaceAll('\\r\n', ' ').replaceAll('\\r\\n', ' ').replaceAll('\\n', ' ').replaceAll('\n', ' ');

        // adr
        if (Array.isArray(val)) {
            if (property.name === 'adr') {
                return val.map((value) =>
                    Array.isArray(value) ? value.map(sanitizeStringValue) : sanitizeStringValue(value)
                );
            }
            return val;
        }

        if (typeof val === 'string') {
            if (property.name === 'adr') {
                return sanitizeStringValue(val);
            }
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
        const flatValues = values.flat(2);
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
 * Tries to get a valid date from a string
 * Returns a valid date only if string is on a valid ISO or string format
 * @param text string to convert into a valid date
 */
export const guessDateFromText = (text: string) => {
    // Try to get a date from a ISO format (e.g. "2014-02-11T11:30:30")
    const isoDate = parseISO(text);
    if (isValid(isoDate)) {
        return isoDate;
    }

    // Try to get a date from a valid string format (e.g. "Jun 9, 2022")
    const textToDate = new Date(text);
    if (isValid(textToDate)) {
        return textToDate;
    }
};

/**
 * Get a date from a VCardProperty<VCardDateOrText>.
 * Returns the vCardProperty.date if present and valid
 * Or tries to return the converted date from vCardProperty.text
 * If none of the above, return today date
 * @param vCardProperty birthday or anniversary vCardProperty
 */
export const getDateFromVCardProperty = ({ value: { date, text } = {} }: VCardProperty<VCardDateOrText>) => {
    if (date && isValid(date)) {
        return date;
    } else if (text) {
        // Try to convert the text into a valid date
        const textToDate = guessDateFromText(text);
        if (textToDate) {
            return textToDate;
        }
    }

    return new Date();
};
