import { serverTime } from '@proton/crypto';
import { absoluteToRelativeTrigger, getIsAbsoluteTrigger } from '@proton/shared/lib/calendar/alarms/trigger';

import { DAY } from '../constants';
import { fromUTCDate } from '../date/timezone';
import { omit, pick } from '../helpers/object';
import {
    AttendeeClearPartResult,
    AttendeePart,
    CalendarEvent,
    CalendarEventData,
    VcalDateOrDateTimeProperty,
    VcalValarmComponent,
    VcalVeventComponent,
} from '../interfaces/calendar';
import { RequireOnly } from '../interfaces/utils';
import { fromInternalAttendee } from './attendees';
import {
    CALENDAR_CARD_TYPE,
    CALENDAR_ENCRYPTED_FIELDS,
    CALENDAR_SIGNED_FIELDS,
    ICAL_EVENT_STATUS,
    NOTIFICATION_TYPE_API,
    REQUIRED_SET,
    SHARED_ENCRYPTED_FIELDS,
    SHARED_SIGNED_FIELDS,
    TAKEN_KEYS,
    USER_ENCRYPTED_FIELDS,
    USER_SIGNED_FIELDS,
} from './constants';
import { generateProtonCalendarUID, getDisplayTitle, hasMoreThan, wrap } from './helper';
import { withMandatoryPublishFields as withVAlarmMandatoryPublishFields } from './valarmHelper';
import { parse, serialize, toTriggerString } from './vcal';
import { prodId } from './vcalConfig';
import { dateTimeToProperty, propertyToUTCDate } from './vcalConverter';
import { getEventStatus, getIsAllDay, getIsCalendar, getIsEventComponent } from './vcalHelper';

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

export const withSummary = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    if (properties.summary) {
        return properties;
    }
    return {
        ...properties,
        summary: { value: '' },
    };
};

/**
 * Helper that takes a vEvent as it could be persisted in our database and returns one that is RFC-compatible for PUBLISH method
 *
 * According to RFC-5546, summary field is mandatory on vEvent for PUBLISH method (https://datatracker.ietf.org/doc/html/rfc5546#section-3.2.1)
 * We also want to add RFC-5545 mandatory fields for vAlarms that we would not have already set persisted in our database
 *
 * @param properties properties of the vEvent
 * @param email email associated with the calendar containing the vevent
 * @returns an RFC-compatible vEvent for PUBLISH method
 */
export const withMandatoryPublishFields = <T>(
    properties: VcalVeventComponent & T,
    email: string
): VcalVeventComponent & T => {
    const eventTitle = getDisplayTitle(properties.summary?.value);

    return withSummary({
        ...properties,
        components: properties.components?.map((component) =>
            withVAlarmMandatoryPublishFields(component, eventTitle, email)
        ),
    });
};

type VeventWithRequiredDtStart<T> = RequireOnly<VcalVeventComponent, 'dtstart'> & T;

export const withoutRedundantDtEnd = <T>(
    properties: VeventWithRequiredDtStart<T>
): VeventWithRequiredDtStart<T> | Omit<VeventWithRequiredDtStart<T>, 'dtend'> => {
    const utcDtStart = +propertyToUTCDate(properties.dtstart);
    const utcDtEnd = properties.dtend ? +propertyToUTCDate(properties.dtend) : undefined;

    // All day events date ranges are stored non-inclusively, so if a full day event has same start and end day, we can ignore it
    const ignoreDtend =
        !utcDtEnd ||
        (getIsAllDay(properties) ? Math.floor((utcDtEnd - utcDtStart) / DAY) <= 1 : utcDtStart === utcDtEnd);

    if (ignoreDtend) {
        return omit(properties, ['dtend']);
    }

    return properties;
};

/**
 * Used to removed `rrule` field in Reply ICS for invite single edit when recurrence-id is filled
 */
export const withoutRedundantRrule = <T>(
    properties: VcalVeventComponent & T
): (VcalVeventComponent & T) | Omit<VcalVeventComponent & T, 'rrule'> => {
    if (Boolean(properties['recurrence-id']) && Boolean(properties.rrule)) {
        return omit(properties, ['rrule']);
    }

    return properties;
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

export const toApiNotifications = (components?: VcalValarmComponent[], dtstart?: VcalDateOrDateTimeProperty) => {
    if (!components) {
        return [];
    }

    return components.map(({ trigger, action }) => {
        const Type =
            action.value.toLowerCase() === 'email' ? NOTIFICATION_TYPE_API.EMAIL : NOTIFICATION_TYPE_API.DEVICE;

        if (getIsAbsoluteTrigger(trigger)) {
            if (!dtstart) {
                throw new Error('Cannot convert absolute trigger without DTSTART');
            }
            const relativeTrigger = {
                value: absoluteToRelativeTrigger(trigger, dtstart),
            };

            return {
                Type,
                Trigger: toTriggerString(relativeTrigger.value),
            };
        }

        return {
            Type,
            Trigger: toTriggerString(trigger.value),
        };
    });
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
        notificationsPart: toApiNotifications(components),
    };
};
