import { Nullable } from '@proton/shared/lib/interfaces';

import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from '../../calendar/constants';
import { DecryptedKey } from '../Key';
import { CalendarSettings, VisualCalendar } from './Calendar';
import { DecryptedCalendarKey } from './CalendarKey';
import { CalendarEvent, CalendarEventWithMetadata } from './Event';
import { VcalAttendeeProperty, VcalOrganizerProperty, VcalVeventComponent } from './VcalModel';

export interface PartstatActions {
    accept: () => Promise<void>;
    acceptTentatively: () => Promise<void>;
    decline: () => Promise<void>;
    retryCreateEvent: ({
        partstat,
        isProtonInvite,
    }: {
        partstat: ICAL_ATTENDEE_STATUS;
        isProtonInvite: boolean;
    }) => Promise<void>;
    retryUpdateEvent: ({
        partstat,
        timestamp,
        isProtonInvite,
        calendarEvent,
    }: {
        partstat: ICAL_ATTENDEE_STATUS;
        timestamp: number;
        isProtonInvite: boolean;
        calendarEvent?: CalendarEvent;
    }) => Promise<void>;
}

export interface CalendarWidgetData {
    calendar: VisualCalendar;
    isCalendarDisabled: boolean;
    calendarNeedsUserAction: boolean;
    memberID?: string;
    addressID?: string;
    addressKeys?: DecryptedKey[];
    calendarKeys?: DecryptedCalendarKey[];
    calendarSettings?: CalendarSettings;
}

export interface PmInviteData {
    isProtonReply?: boolean;
    sharedEventID?: string;
    sharedSessionKey?: string;
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
    updateTime?: Nullable<number>;
    attendeeID?: string;
}

export interface SavedImportData {
    savedEvent: CalendarEventWithMetadata;
    savedVevent: VcalVeventComponent;
}

export interface SavedInviteData extends SavedImportData {
    savedVcalAttendee: VcalAttendeeProperty;
}
