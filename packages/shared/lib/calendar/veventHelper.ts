import { useGetCalendarKeys } from '@proton/components';
import { serverTime } from 'pmcrypto';
import { fromUTCDate } from '../date/timezone';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import { omit, pick } from '../helpers/object';
import {
    AttendeeClearPartResult,
    AttendeePart,
    CalendarEvent,
    CalendarEventData,
    DecryptedCalendarKey,
    VcalValarmComponent,
    VcalVeventComponent,
} from '../interfaces/calendar';
import { RequireOnly } from '../interfaces/utils';
import { splitKeys } from '../keys';
import { fromInternalAttendee } from './attendees';
import {
    CALENDAR_CARD_TYPE,
    CALENDAR_ENCRYPTED_FIELDS,
    CALENDAR_SIGNED_FIELDS,
    ICAL_EVENT_STATUS,
    REQUIRED_SET,
    SHARED_ENCRYPTED_FIELDS,
    SHARED_SIGNED_FIELDS,
    TAKEN_KEYS,
    USER_ENCRYPTED_FIELDS,
    USER_SIGNED_FIELDS,
} from './constants';
import { readSessionKeys } from './deserialize';
import { generateProtonCalendarUID, hasMoreThan, wrap } from './helper';
import { parse, serialize } from './vcal';
import { prodId } from './vcalConfig';
import { dateTimeToProperty } from './vcalConverter';
import { getEventStatus, getIsCalendar, getIsEventComponent } from './vcalHelper';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

export const getReadableCard = (cards: CalendarEventData[]) => {
    return cards.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
};

export const getIsEventCancelled = (event: CalendarEvent) => {
    const calendarClearTextPart = getReadableCard(event.CalendarEvents);
    if (!calendarClearTextPart) {
        return;
    }
    const vcalPart = parse(calendarClearTextPart.Data);
    const vevent = getIsCalendar(vcalPart) ? vcalPart.components?.find(getIsEventComponent) : undefined;
    if (!vevent) {
        return;
    }
    return getEventStatus(vevent) === ICAL_EVENT_STATUS.CANCELLED;
};

export const withUid = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    if (properties.uid) {
        return properties;
    }
    return {
        ...properties,
        uid: { value: generateProtonCalendarUID() },
    };
};

export const withSummary = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    if (properties.summary) {
        return properties;
    }
    return {
        ...properties,
        summary: { value: '' },
    };
};

export const withDtstamp = <T>(
    properties: RequireOnly<VcalVeventComponent, 'uid' | 'component' | 'dtstart'> & T,
    timestamp?: number
): VcalVeventComponent & T => {
    if (properties.dtstamp) {
        return properties as VcalVeventComponent & T;
    }
    const timestampToUse = timestamp !== undefined ? timestamp : +serverTime();
    return {
        ...properties,
        dtstamp: dateTimeToProperty(fromUTCDate(new Date(timestampToUse)), true),
    };
};

export const withRequiredProperties = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    return withDtstamp(withUid(properties));
};

export const getSharedPart = (properties: VcalVeventComponent) => {
    return {
        [SIGNED]: pick(properties, SHARED_SIGNED_FIELDS),
        [ENCRYPTED_AND_SIGNED]: pick(properties, SHARED_ENCRYPTED_FIELDS),
    };
};

export const getCalendarPart = (properties: VcalVeventComponent) => {
    return {
        [SIGNED]: pick(properties, CALENDAR_SIGNED_FIELDS),
        [ENCRYPTED_AND_SIGNED]: pick(properties, CALENDAR_ENCRYPTED_FIELDS),
    };
};

export const getUserPart = (veventProperties: VcalVeventComponent) => {
    return {
        [SIGNED]: pick(veventProperties, USER_SIGNED_FIELDS),
        [ENCRYPTED_AND_SIGNED]: pick(veventProperties, USER_ENCRYPTED_FIELDS),
    };
};

export const getAttendeesPart = (
    veventProperties: VcalVeventComponent
): {
    [CLEAR_TEXT]: AttendeeClearPartResult[];
    [ENCRYPTED_AND_SIGNED]: Partial<VcalVeventComponent>;
} => {
    const formattedAttendees: { [CLEAR_TEXT]: AttendeeClearPartResult[]; attendee: AttendeePart[] } = {
        [CLEAR_TEXT]: [],
        attendee: [],
    };
    if (Array.isArray(veventProperties.attendee)) {
        for (const attendee of veventProperties.attendee) {
            const { clear, attendee: newAttendee } = fromInternalAttendee(attendee);
            formattedAttendees[CLEAR_TEXT].push(clear);
            formattedAttendees.attendee.push(newAttendee);
        }
    }

    if (!formattedAttendees.attendee.length) {
        return {
            [ENCRYPTED_AND_SIGNED]: {},
            [CLEAR_TEXT]: [],
        };
    }

    const result: Pick<VcalVeventComponent, 'uid' | 'attendee'> = {
        uid: veventProperties.uid,
        attendee: formattedAttendees.attendee,
    };

    return {
        [ENCRYPTED_AND_SIGNED]: result,
        [CLEAR_TEXT]: formattedAttendees[CLEAR_TEXT],
    };
};

const toResult = (veventProperties: Partial<VcalVeventComponent>, veventComponents: VcalValarmComponent[] = []) => {
    // Add PRODID to identify the author of the last event modification
    return wrap(
        serialize({
            ...veventProperties,
            component: 'vevent',
            components: veventComponents,
        }),
        prodId
    );
};

/**
 * Ignores the result if the vevent does not contain anything more than the required set (uid, dtstamp, and children).
 */
const toResultOptimized = (
    veventProperties: Partial<VcalVeventComponent>,
    veventComponents: VcalValarmComponent[] = []
) => {
    return hasMoreThan(REQUIRED_SET, veventProperties) || veventComponents.length
        ? toResult(veventProperties, veventComponents)
        : undefined;
};

/**
 * Split the internal vevent component into the parts expected by the API.
 */
export const getVeventParts = ({ components, ...properties }: VcalVeventComponent) => {
    const restProperties = omit(properties, TAKEN_KEYS);

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
                ...restProperties,
            }),
        },
        calendarPart: {
            [SIGNED]: toResultOptimized(calendarPart[SIGNED]),
            [ENCRYPTED_AND_SIGNED]: toResultOptimized(calendarPart[ENCRYPTED_AND_SIGNED]),
        },
        personalPart: {
            // Assume all sub-components are valarm that go in the personal part
            [SIGNED]: toResultOptimized(personalPart[SIGNED], components),
            // Nothing to encrypt for now
            [ENCRYPTED_AND_SIGNED]: undefined,
        },
        attendeesPart: {
            // Nothing to sign for now
            [SIGNED]: undefined,
            [ENCRYPTED_AND_SIGNED]: toResultOptimized(attendeesPart[ENCRYPTED_AND_SIGNED]),
            [CLEAR_TEXT]: attendeesPart[CLEAR_TEXT],
        },
    };
};

export const getSharedEventIDAndSessionKey = async ({
    calendarEvent,
    calendarKeys,
    getCalendarKeys,
}: {
    calendarEvent: CalendarEvent;
    calendarKeys?: DecryptedCalendarKey[];
    getCalendarKeys?: ReturnType<typeof useGetCalendarKeys>;
}) => {
    try {
        if (!calendarKeys && !getCalendarKeys) {
            return {};
        }
        const { CalendarID, SharedEventID } = calendarEvent;
        // we need to decrypt the sharedKeyPacket in Event to obtain the decrypted session key
        const { privateKeys } = splitKeys(calendarKeys || (await getCalendarKeys!(CalendarID)));
        const [sessionKey] = await readSessionKeys({ calendarEvent, privateKeys });

        return {
            sharedEventID: SharedEventID,
            sharedSessionKey: sessionKey ? uint8ArrayToBase64String(sessionKey.data) : undefined,
        };
    } catch (e: any) {
        return {};
    }
};
