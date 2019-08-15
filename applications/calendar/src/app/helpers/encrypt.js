import { toICAL } from './vcard';
import { encryptMessage, signMessage } from 'pmcrypto';
import { secondsToMilliseconds } from './time';

const SHARED_SIGNED_FIELDS = [
    'version',
    'prodid',
    'dtstamp',
    'dtstart',
    'dtend',
    'uid',
    'rrule',
    'transp',
    'vtimezone'
];
const CALENDAR_SIGNED_FIELDS = ['version', 'prodid', 'uid'];
const CALENDAR_ENCRYPTED_FIELDS = [];

export const CALENDAR_CARD_TYPE = {
    ENCRYPTED_AND_SIGNED: 3,
    SIGNED: 2,
    ENCRYPTED: 1
};

const { ENCRYPTED_AND_SIGNED, SIGNED } = CALENDAR_CARD_TYPE;

/**
 * Generates a calendar UID of the form 'proton-web-uuid'
 * @return {String}
 */
export const generateUID = () => {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    return `proton-web-${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

/**
 * Split properties for contact cards
 * @param {Array} properties
 * @param {Array} toSign
 * @param {Array} [toEncryptAndSign]
 * @returns {Object}
 */
export const splitProperties = (properties, { toSign, toEncryptAndSign }) => {
    return properties.reduce(
        (acc, property) => {
            const { field } = property;

            if (toSign.includes(field)) {
                acc.toSign.push(property);
                return acc;
            }

            if (!toEncryptAndSign) {
                acc.toEncryptAndSign.push(property);
            } else {
                if (toEncryptAndSign.includes(field)) {
                    acc.toEncryptAndSign.push(property);
                    return acc;
                }
            }

            return acc;
        },
        { toEncryptAndSign: [], toSign: [] }
    );
};

/**
 * Prepare calendar cards
 * @param {Array} toSign
 * @param {Array} toEncryptAndSign
 * @param {Array} privateKeys
 * @param {Array} publicKeys
 * @returns {Promise}
 */
export const prepareCards = ({ toEncryptAndSign, toSign }, privateKeys, publicKeys) => {
    const promises = [];

    if (toEncryptAndSign.length > 0) {
        const data = toICAL(toEncryptAndSign).toString();

        promises.push(
            encryptMessage({ data, publicKeys, privateKeys, armor: true, detached: true }).then(
                ({ data: Data, signature: Signature }) => ({
                    Type: ENCRYPTED_AND_SIGNED,
                    Data,
                    Signature
                })
            )
        );
    }

    if (toSign.length > 0) {
        const data = toICAL(toSign).toString();

        promises.push(
            signMessage({ data, privateKeys, armor: true, detached: true }).then(({ signature: Signature }) => ({
                Type: SIGNED,
                Data: data,
                Signature
            }))
        );
    }

    return Promise.all(promises);
};

/**
 * Clean properties
 * Parse properties to build vCards
 * @param {Array} properties
 * @param {Array} privateKeys
 * @param {Array} publicKeys
 * @return {Object}
 */
export const prepareCalendar = async (properties, privateKeys, publicKeys) => {
    /*
    const sanitized = sanitizeProperties(properties);
    const withPref = addPref(sanitized);
    const withGroup = addGroup(withPref);
    */

    const hasUID = properties.some((property) => property.field === 'uid');
    const hasDTStamp = properties.some((property) => property.field === 'dtstamp');

    if (!hasUID) {
        const defaultUID = generateUID();
        properties.unshift({ field: 'uid', value: defaultUID });
    }

    if (!hasDTStamp) {
        const creationDate = new Date();
        properties.unshift({ field: 'dtstamp', value: secondsToMilliseconds(creationDate.getTime()) });
    }

    const sharedPart = splitProperties(properties, { toSign: SHARED_SIGNED_FIELDS });
    const calendarPart = splitProperties(properties, {
        toSign: CALENDAR_SIGNED_FIELDS,
        toEncryptAndSign: CALENDAR_ENCRYPTED_FIELDS
    });

    const sharedCards = await prepareCards(sharedPart, privateKeys, publicKeys);
    const calendarCards = await prepareCards(calendarPart, privateKeys, publicKeys);

    return { sharedCards, calendarCards };
};
