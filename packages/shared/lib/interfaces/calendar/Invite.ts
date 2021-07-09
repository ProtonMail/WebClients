import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from '../../calendar/constants';
import { DecryptedKey } from '../Key';
import { Calendar, CalendarSettings } from './Calendar';
import { DecryptedCalendarKey } from './CalendarKey';
import { CalendarEvent } from './Event';
import { VcalAttendeeProperty, VcalOrganizerProperty, VcalVeventComponent } from './VcalModel';

export interface PartstatActions {
    accept: () => Promise<void>;
    acceptTentatively: () => Promise<void>;
    decline: () => Promise<void>;
    retryCreateEvent: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
    retryUpdateEvent: (partstat: ICAL_ATTENDEE_STATUS, timestamp: number) => Promise<void>;
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

export interface PmInviteData {
    sharedEventID: string;
    sharedSessionKey: string;
}

export interface Participant {
    vcalComponent: VcalAttendeeProperty | VcalOrganizerProperty;
    name: string;
    emailAddress: string;
    displayName: string;
    displayEmail: string;
    partstat?: ICAL_ATTENDEE_STATUS;
    role?: ICAL_ATTENDEE_ROLE;
    addressID?: string;
    attendeeIndex?: number;
    token?: string;
    updateTime?: number;
    attendeeID?: string;
}

export interface SavedImportData {
    savedEvent: CalendarEvent;
    savedVevent: VcalVeventComponent;
}

export interface SavedInviteData extends SavedImportData {
    savedVcalAttendee: VcalAttendeeProperty;
}
