import { normalize } from '../helpers/string';
import {
    VcalAttendeeProperty,
    VcalAttendeePropertyWithCn,
    VcalAttendeePropertyWithPartstat,
    VcalAttendeePropertyWithRole,
    VcalAttendeePropertyWithToken,
    VcalCalendarComponent,
    VcalDateOrDateTimeProperty,
    VcalDateOrDateTimeValue,
    VcalDateProperty,
    VcalDateTimeValue,
    VcalStringProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVfreebusyComponent,
    VcalVjournalComponent,
    VcalVtimezoneComponent,
    VcalVtodoComponent,
    VcalXOrIanaComponent,
} from '../interfaces/calendar';
import {
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
    ICAL_METHOD,
    ICAL_METHODS_ATTENDEE,
    ICAL_METHODS_ORGANIZER,
} from './constants';

export const getIsPropertyAllDay = (property: VcalDateOrDateTimeProperty): property is VcalDateProperty => {
    return property.parameters?.type === 'date' ?? false;
};

export const getPropertyTzid = (property: VcalDateOrDateTimeProperty) => {
    if (getIsPropertyAllDay(property)) {
        return;
    }
    return property.value.isUTC ? 'UTC' : property.parameters?.tzid;
};

export const getIsAllDay = ({ dtstart }: Pick<VcalVeventComponent, 'dtstart'>) => {
    return getIsPropertyAllDay(dtstart);
};

export const getIsRecurring = ({ rrule }: Pick<VcalVeventComponent, 'rrule'>) => {
    return !!rrule;
};

export const getRecurrenceId = ({ 'recurrence-id': recurrenceId }: Pick<VcalVeventComponent, 'recurrence-id'>) => {
    return recurrenceId;
};

export const getSequence = (event: VcalVeventComponent) => {
    const sequence = +(event.sequence?.value || 0);
    return Math.max(sequence, 0);
};

export const getIsDateTimeValue = (value: VcalDateOrDateTimeValue): value is VcalDateTimeValue => {
    return (value as VcalDateTimeValue).hours !== undefined;
};

export const getIsCalendar = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVcalendar => {
    return vcalComponent?.component?.toLowerCase() === 'vcalendar';
};

export const getIsEventComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVeventComponent => {
    return vcalComponent?.component?.toLowerCase() === 'vevent';
};

export const getIsTodoComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVtodoComponent => {
    return vcalComponent?.component?.toLowerCase() === 'vtodo';
};

export const getIsJournalComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVjournalComponent => {
    return vcalComponent?.component?.toLowerCase() === 'vjournal';
};

export const getIsFreebusyComponent = (
    vcalComponent: VcalCalendarComponent
): vcalComponent is VcalVfreebusyComponent => {
    return vcalComponent?.component?.toLowerCase() === 'vfreebusy';
};

export const getIsTimezoneComponent = (
    vcalComponent: VcalCalendarComponent
): vcalComponent is VcalVtimezoneComponent => {
    return vcalComponent?.component?.toLowerCase() === 'vtimezone';
};

export const getIsAlarmComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVtimezoneComponent => {
    return vcalComponent?.component?.toLowerCase() === 'valarm';
};

export const getIsXOrIanaComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalXOrIanaComponent => {
    const name = vcalComponent?.component?.toLowerCase();
    return !['vcalendar', 'vevent', 'vtodo', 'vjournal', 'vfreebusy', 'vtimezone'].includes(name);
};

export const getHasUid = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'uid'>> => {
    return !!vevent.uid?.value;
};

export const getHasDtStart = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtstart'>> => {
    return !!vevent.dtstart?.value;
};

export const getHasDtend = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>> => {
    return !!vevent.dtend;
};

export const getHasRecurrenceId = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'recurrence-id'>> => {
    return !!vevent['recurrence-id'];
};

export const getHasAttendee = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'attendee'>> => {
    return !!vevent.attendee;
};

export const getHasAttendees = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'attendee'>> => {
    return !!vevent.attendee?.length;
};

export const getAttendeeHasCn = (attendee: VcalAttendeeProperty): attendee is VcalAttendeePropertyWithCn => {
    return !!attendee.parameters?.cn;
};

export const getAttendeesHaveCn = (
    vcalAttendee: VcalAttendeeProperty[]
): vcalAttendee is VcalAttendeePropertyWithCn[] => {
    return !vcalAttendee.some((vcalAttendee) => !getAttendeeHasCn(vcalAttendee));
};

export const getAttendeeHasToken = (attendee: VcalAttendeeProperty): attendee is VcalAttendeePropertyWithToken => {
    return !!attendee.parameters?.['x-pm-token'];
};

export const getAttendeesHaveToken = (
    vcalAttendee: VcalAttendeeProperty[]
): vcalAttendee is VcalAttendeePropertyWithToken[] => {
    return !vcalAttendee.some((vcalAttendee) => !getAttendeeHasToken(vcalAttendee));
};

export const getAttendeeHasPartStat = (
    attendee: VcalAttendeeProperty
): attendee is VcalAttendeePropertyWithPartstat => {
    return !!attendee.parameters?.partstat;
};

export const getAttendeeHasRole = (attendee: VcalAttendeeProperty): attendee is VcalAttendeePropertyWithRole => {
    return !!attendee.parameters?.role;
};

export const getIcalMethod = (method?: VcalStringProperty) => {
    if (!method) {
        return ICAL_METHOD.PUBLISH;
    }
    const normalizedValue = normalize(method.value);
    const matchesNormalizedValue = (icalMethod: ICAL_METHOD) => normalize(icalMethod) === normalizedValue;

    return Object.values(ICAL_METHOD).find(matchesNormalizedValue);
};

export const getIsValidMethod = (method: ICAL_METHOD, isOrganizerMode: boolean) => {
    if (method === ICAL_METHOD.DECLINECOUNTER) {
        // we should never encounter DECLINECOUNTER for the moment
        return false;
    }
    return isOrganizerMode ? ICAL_METHODS_ATTENDEE.includes(method) : ICAL_METHODS_ORGANIZER.includes(method);
};

export const getEventStatus = ({ status }: VcalVeventComponent) => {
    if (Object.values(ICAL_EVENT_STATUS).some((icalStatus) => icalStatus === status?.value)) {
        return status?.value as ICAL_EVENT_STATUS;
    }
    return ICAL_EVENT_STATUS.CONFIRMED;
};

export const getAttendeePartstat = (attendee: Partial<VcalAttendeeProperty> = {}, xYahooUserStatus?: string) => {
    const partstat = attendee.parameters?.partstat;
    if (partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION && xYahooUserStatus) {
        // Yahoo Calendar does not follow the RFC and encodes the partstat in a custom property
        if (xYahooUserStatus === 'BUSY') {
            return ICAL_ATTENDEE_STATUS.ACCEPTED;
        }
        if (xYahooUserStatus === 'TENTATIVE') {
            return ICAL_ATTENDEE_STATUS.TENTATIVE;
        }
        if (xYahooUserStatus === 'FREE') {
            return ICAL_ATTENDEE_STATUS.DECLINED;
        }
    }
    if (Object.values(ICAL_ATTENDEE_STATUS).some((icalPartstat) => icalPartstat === partstat)) {
        return partstat as ICAL_ATTENDEE_STATUS;
    }
    return ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
};

export const getAttendeeRole = (attendee: Partial<VcalAttendeeProperty> = {}) => {
    const role = attendee.parameters?.role;
    if (Object.values(ICAL_ATTENDEE_ROLE).some((icalRole) => icalRole === role)) {
        return role as ICAL_ATTENDEE_ROLE;
    }
    return ICAL_ATTENDEE_ROLE.REQUIRED;
};

export const getAttendeeToken = (attendee: Partial<VcalAttendeeProperty> = {}) => {
    return attendee?.parameters?.['x-pm-token'];
};

export const getIsYahooEvent = (veventComponent: VcalVeventComponent) => {
    return !!(veventComponent['x-yahoo-yid'] || veventComponent['x-yahoo-user-status']);
};

export const getIsProtonReply = (veventComponent: VcalVeventComponent) => {
    const stringifiedValue = veventComponent['x-pm-proton-reply']?.value;
    if (!stringifiedValue) {
        return;
    }
    return stringifiedValue === 'true';
};

export const getPmSharedEventID = (veventComponent: VcalVeventComponent) => {
    return veventComponent['x-pm-shared-event-id']?.value;
};

export const getPmSharedSessionKey = (veventComponent: VcalVeventComponent) => {
    return veventComponent['x-pm-session-key']?.value;
};
