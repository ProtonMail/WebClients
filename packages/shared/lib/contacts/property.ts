import isTruthy from '../helpers/isTruthy';
import { ContactProperty } from '../interfaces/contacts';

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
 * @return currently an array for the field adr, a string otherwise
 */
export const getValue = (property: any): string | string[] => {
    const [value] = getRawValues(property).map((val: string | string[] | Date) => {
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

    return value;
};

/**
 * Returns true if a property has an empty value
 */
export const isEmptyValued = (property: ContactProperty): boolean => {
    const { value } = property;
    // property values must be strings or arrays of strings
    if (typeof value === 'string') {
        return !value;
    }
    if (Array.isArray(value)) {
        return !value.some((str) => str);
    }
    return true;
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
 * Transform an array value for the field 'adr' into a string to be displayed
 */
export const formatAdr = (adr: string[] = []): string => {
    return adr
        .filter(isTruthy)
        .map((value) => value.trim())
        .join(', ');
};
