import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { Address } from '@proton/shared/lib/interfaces';
import { CalendarEvent, VcalAttendeeProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { AugmentedSendPreferences } from '../containers/calendar/interface';

export enum INVITE_ACTION_TYPES {
    NONE,
    CHANGE_PARTSTAT,
    DECLINE_INVITATION,
    DECLINE_DISABLED,
    SEND_INVITATION, // organizer creates new invitation, or just adds/removes attendees
    SEND_UPDATE, // organizer updates event details and/or attendees
    CANCEL_INVITATION, // organizer deletes invitation
    CANCEL_DISABLED, // organizer deletes invitation but can't notify attendees
}

export interface InviteActions {
    type: INVITE_ACTION_TYPES;
    sharedEventID?: string;
    sharedSessionKey?: string;
    isProtonProtonInvite?: boolean;
    partstat?: ICAL_ATTENDEE_STATUS;
    sendCancellationNotice?: boolean;
    resetSingleEditsPartstat?: boolean;
    deleteSingleEdits?: boolean;
    selfAddress?: Address;
    selfAttendeeIndex?: number;
    addedAttendees?: VcalAttendeeProperty[];
    removedAttendees?: VcalAttendeeProperty[];
    hasRemovedAllAttendees?: boolean;
}

export interface RecurringActionData {
    type: RECURRING_TYPES;
    inviteActions: InviteActions;
}

export interface SendIcsActionData {
    inviteActions: InviteActions;
    vevent?: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    noCheckSendPrefs?: boolean;
}

export interface ReencryptInviteActionData {
    calendarEvent: CalendarEvent;
    calendarID: string;
}

export interface CleanSendIcsActionData extends SendIcsActionData {
    sendPreferencesMap: SimpleMap<AugmentedSendPreferences>;
}

export interface UpdatePartstatOperation {
    data: {
        calendarID: string;
        eventID: string;
        attendeeID: string;
        partstat: ICAL_ATTENDEE_STATUS;
        updateTime: number;
    };
    silence: boolean;
}

export interface UpdatePersonalPartOperation {
    data: {
        calendarID: string;
        eventID: string;
        addressID?: string;
        eventComponent?: VcalVeventComponent;
        hasDefaultNotifications?: boolean;
    };
}
