import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from '../../calendar/constants';
import { CachedKey } from '../CachedKey';
import { Calendar, CalendarSettings } from './Calendar';
import { CalendarEvent } from './Event';
import { VcalAttendeeProperty, VcalOrganizerProperty, VcalVeventComponent } from './VcalModel';

export interface InviteActions {
    accept: () => Promise<void>;
    acceptTentatively: () => Promise<void>;
    decline: () => Promise<void>;
    retryCreateEvent: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
    retryUpdateEvent: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
}

export interface CalendarWidgetData {
    calendar: Calendar;
    isCalendarDisabled: boolean;
    memberID?: string;
    addressKeys?: CachedKey[];
    calendarKeys?: CachedKey[];
    calendarSettings?: CalendarSettings;
}

export interface Participant {
    vcalComponent: VcalAttendeeProperty | VcalOrganizerProperty;
    name: string;
    emailAddress: string;
    partstat?: ICAL_ATTENDEE_STATUS;
    role?: ICAL_ATTENDEE_ROLE;
    addressID?: string;
    displayName?: string;
}

export interface SavedInviteData {
    savedEvent: CalendarEvent;
    savedVevent: VcalVeventComponent;
    savedVcalAttendee: VcalAttendeeProperty;
}
