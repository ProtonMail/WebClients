import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from '../../calendar/constants';
import { Calendar, CalendarSettings } from './Calendar';
import { CalendarEvent } from './Event';
import { VcalAttendeeProperty, VcalOrganizerProperty, VcalVeventComponent } from './VcalModel';
import { DecryptedKey } from '../Key';
import { DecryptedCalendarKey } from './CalendarKey';

export interface PartstatActions {
    accept: () => Promise<void>;
    acceptTentatively: () => Promise<void>;
    decline: () => Promise<void>;
    retryCreateEvent: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
    retryUpdateEvent: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
}

export interface CalendarWidgetData {
    calendar: Calendar;
    isCalendarDisabled: boolean;
    calendarNeedsUserAction: boolean;
    memberID?: string;
    addressKeys?: DecryptedKey[];
    calendarKeys?: DecryptedCalendarKey[];
    calendarSettings?: CalendarSettings;
}

export interface SingleEditWidgetData {
    ids: string[];
}

export interface Participant {
    vcalComponent: VcalAttendeeProperty | VcalOrganizerProperty;
    name: string;
    emailAddress: string;
    displayName: string;
    displayEmail: string;
    partstat: ICAL_ATTENDEE_STATUS;
    role?: ICAL_ATTENDEE_ROLE;
    addressID?: string;
    attendeeIndex?: number;
    token?: string;
    updateTime?: number;
    attendeeID?: string;
}

export interface SavedInviteData {
    savedEvent: CalendarEvent;
    savedVevent: VcalVeventComponent;
    savedVcalAttendee: VcalAttendeeProperty;
}
