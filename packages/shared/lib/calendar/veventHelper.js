import { wrap, splitProperties, generateUID, hasMoreThan, getRestProperties } from './helper';
import { serialize } from './vcal';
import { CALENDAR_CARD_TYPE } from './constants';
import { fromInternalAttendee } from './attendees';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR } = CALENDAR_CARD_TYPE;

export const SHARED_SIGNED_FIELDS = [
    'uid',
    'dtstamp',
    'dtstart',
    'dtend',
    'recurrence-id',
    'rrule',
    'exdate',
    'transp',
    'vtimezone'
];
export const SHARED_ENCRYPTED_FIELDS = ['uid', 'dtstamp', 'created', 'description', 'summary', 'location'];

export const CALENDAR_SIGNED_FIELDS = ['uid', 'dtstamp'];
export const CALENDAR_ENCRYPTED_FIELDS = ['uid', 'dtstamp', 'comment'];

export const USER_SIGNED_FIELDS = ['uid', 'dtstamp'];
export const USER_ENCRYPTED_FIELDS = [];

export const ATTENDEES_SIGNED_FIELDS = [];
export const ATTENDEES_ENCRYPTED_FIELDS = ['uid', 'attendee'];

const REQUIRED_SET = new Set(['uid', 'dtstamp']);

// Set of taken keys to put the rest
const TAKEN_KEYS_SET = new Set(
    SHARED_SIGNED_FIELDS.concat(SHARED_ENCRYPTED_FIELDS)
        .concat(CALENDAR_ENCRYPTED_FIELDS)
        .concat(CALENDAR_SIGNED_FIELDS)
        .concat(USER_SIGNED_FIELDS)
        .concat(USER_ENCRYPTED_FIELDS)
        .concat(ATTENDEES_ENCRYPTED_FIELDS)
        .concat(ATTENDEES_SIGNED_FIELDS)
);

/**
 * @param {Object} properties
 * @return {Object}
 */
export const withRequiredProperties = (properties) => {
    if (properties.uid && properties.dtstamp) {
        return properties;
    }
    const creationDate = new Date();
    return {
        uid: { value: generateUID() },
        dtstamp: {
            value: {
                year: creationDate.getUTCFullYear(),
                month: creationDate.getUTCMonth() + 1,
                day: creationDate.getUTCDate(),
                hours: creationDate.getUTCHours(),
                minutes: creationDate.getUTCMinutes(),
                seconds: creationDate.getUTCSeconds(),
                isUTC: true
            },
            parameters: { type: 'date-time' }
        },
        ...properties
    };
};

export const getSharedPart = (properties) => {
    return splitProperties(properties, {
        [SIGNED]: SHARED_SIGNED_FIELDS,
        [ENCRYPTED_AND_SIGNED]: SHARED_ENCRYPTED_FIELDS
    });
};

export const getCalendarPart = (properties) => {
    return splitProperties(properties, {
        [SIGNED]: CALENDAR_SIGNED_FIELDS,
        [ENCRYPTED_AND_SIGNED]: CALENDAR_ENCRYPTED_FIELDS
    });
};

export const getUserPart = (veventProperties) => {
    return splitProperties(veventProperties, {
        [SIGNED]: USER_SIGNED_FIELDS,
        [ENCRYPTED_AND_SIGNED]: USER_ENCRYPTED_FIELDS
    });
};

export const getAttendeesPart = (veventProperties) => {
    const formattedAttendees = Array.isArray(veventProperties.attendee)
        ? veventProperties.attendee.reduce(
              (acc, attendee) => {
                  const { clear, attendee: newAttendee } = fromInternalAttendee(attendee);
                  acc[CLEAR].push(clear);
                  acc.attendee.push(newAttendee);
                  return acc;
              },
              { [CLEAR]: [], attendee: [] }
          )
        : undefined;

    return {
        [ENCRYPTED_AND_SIGNED]: formattedAttendees
            ? {
                  uid: veventProperties.uid,
                  attendee: formattedAttendees.attendee
              }
            : undefined,
        [CLEAR]: formattedAttendees ? formattedAttendees[CLEAR] : undefined
    };
};

/**
 * @param {Object} veventProperties
 * @param {Array} [veventComponents]
 * @return {string}
 */
const toResult = (veventProperties, veventComponents = []) => {
    return wrap(
        serialize({
            component: 'vevent',
            components: veventComponents,
            ...veventProperties
        })
    );
};

/**
 * Ignores the result if the vevent does not contain anything more than the required set (uid, dtstamp, and children).
 * @param {Object} veventProperties
 * @param {Array} [veventComponents]
 * @return {*}
 */
const toResultOptimized = (veventProperties, veventComponents = []) => {
    return hasMoreThan(REQUIRED_SET, veventProperties) || veventComponents.length
        ? toResult(veventProperties, veventComponents)
        : undefined;
};

/**
 * Split the internal vevent component into the parts expected by the API.
 * @param {Array} components
 * @param {Object} properties
 * @return {Object}
 */
export const getVeventParts = ({ components, ...properties }) => {
    const restProperties = getRestProperties(properties, TAKEN_KEYS_SET);

    const sharedPart = getSharedPart(properties);
    const calendarPart = getCalendarPart(properties);
    const personalPart = getUserPart(properties);
    const attendeesPart = getAttendeesPart(properties);

    return {
        sharedPart: {
            [SIGNED]: toResult(sharedPart[SIGNED]),
            // Store all the rest of the properties in the shared encrypted part
            [ENCRYPTED_AND_SIGNED]: toResult({
                ...sharedPart[ENCRYPTED_AND_SIGNED],
                ...restProperties
            })
        },
        calendarPart: {
            [SIGNED]: toResultOptimized(calendarPart[SIGNED]),
            [ENCRYPTED_AND_SIGNED]: toResultOptimized(calendarPart[ENCRYPTED_AND_SIGNED])
        },
        personalPart: {
            // Assume all sub-components are valarm that go in the personal part
            [SIGNED]: toResultOptimized(personalPart[SIGNED], components),
            // Nothing to encrypt for now
            [ENCRYPTED_AND_SIGNED]: undefined
        },
        attendeesPart: {
            // Nothing to sign for now
            [SIGNED]: undefined,
            [ENCRYPTED_AND_SIGNED]: toResultOptimized(attendeesPart[ENCRYPTED_AND_SIGNED]),
            [CLEAR]: attendeesPart[CLEAR]
        }
    };
};
