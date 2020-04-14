import getRandomValues from 'get-random-values';
import { encodeBase64, arrayToBinaryString } from 'pmcrypto';

/**
 * Generates a calendar UID of the form 'proton-calendar-uuid'
 * @return {String}
 */
export const generateUID = () => {
    // by convention we generate 21 bytes of random data
    const randomBytes = getRandomValues(new Uint8Array(21));
    const base64String = encodeBase64(arrayToBinaryString(randomBytes));
    // and we encode them in base 64
    return `${base64String}@proton.me`;
};

/**
 * @param {Object} properties
 * @param {Object} splits
 * @returns {Object}
 */
export const splitProperties = (properties, splits) => {
    const keys = Object.keys(splits);
    return Object.keys(properties).reduce((acc, propertyName) => {
        keys.forEach((key) => {
            if (splits[key].includes(propertyName)) {
                if (!acc[key]) {
                    acc[key] = {};
                }
                acc[key][propertyName] = properties[propertyName];
            }
        });
        return acc;
    }, {});
};

/**
 * @param {Object} properties
 * @param {Set} takenKeysMap
 * @return {{calendarPart, sharedPart}}
 */
export const getRestProperties = (properties, takenKeysMap) => {
    const allKeys = Object.keys(properties);
    return allKeys.reduce((acc, key) => {
        if (takenKeysMap.has(key)) {
            return acc;
        }
        acc[key] = properties[key];
        return acc;
    }, {});
};

/**
 * Check whether an object has more keys than a set of keys.
 * @param {Set} set
 * @param {Object} properties
 * @returns {boolean}
 */
export const hasMoreThan = (set, properties = {}) => {
    return Object.keys(properties).some((key) => !set.has(key));
};

export const wrap = (res) => {
    return `BEGIN:VCALENDAR
VERSION:2.0
${res}
END:VCALENDAR`;
};

export const unwrap = (res) => {
    if (res.slice(0, 15) !== 'BEGIN:VCALENDAR') {
        return res;
    }
    const startIdx = res.indexOf('BEGIN:', 1);
    if (startIdx === -1 || startIdx === 0) {
        return '';
    }
    const endIdx = res.lastIndexOf('END:VCALENDAR');
    return res.slice(startIdx, endIdx).trim();
};
