import type { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import type { Address, RequireSome } from '@proton/shared/lib/interfaces';
import type {
    AttendeeComment,
    CalendarEvent,
    VcalAttendeeProperty,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import type { PartstatData } from '@proton/shared/lib/interfaces/calendar';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import type { AugmentedSendPreferences } from '../containers/calendar/interface';

export enum INVITE_ACTION_TYPES {
    NONE,
    CHANGE_PARTSTAT, // attendee changed RSVP response and/or RSVP comment
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
    /** The encrypted and signed comment for to send to the API */
    comment?: AttendeeComment;
    /** The clearText comment to insert in the ICS */
    commentClearText?: string;
    /** The old partstat data for comparison in email bodies */
    oldPartstatData?: PartstatData;
    sendCancellationNotice?: boolean;
    resetSingleEditsPartstat?: boolean;
    deleteSingleEdits?: boolean;
    selfAddress?: Address;
    selfAttendeeIndex?: number;
    addedAttendees?: VcalAttendeeProperty[];
    removedAttendees?: VcalAttendeeProperty[];
    hasRemovedAllAttendees?: boolean;
    hasModifiedRole?: boolean;
    recurringType?: RECURRING_TYPES;
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
    sendPreferencesMap?: SimpleMap<AugmentedSendPreferences>;
}

export type SendIcs = {
    (
        data: RequireSome<SendIcsActionData, 'vevent'>,
        calendarID?: string
    ): Promise<{
        veventComponent: VcalVeventComponent;
        inviteActions: InviteActions;
        timestamp: number;
        sendPreferencesMap: SimpleMap<AugmentedSendPreferences>;
    }>;
    (
        data: SendIcsActionData,
        calendarID?: string
    ): Promise<{
        veventComponent?: VcalVeventComponent;
        inviteActions: InviteActions;
        timestamp: number;
        sendPreferencesMap: SimpleMap<AugmentedSendPreferences>;
    }>;
};

export type OnSendPrefsErrors = {
    (data: RequireSome<SendIcsActionData, 'vevent'>): Promise<RequireSome<CleanSendIcsActionData, 'vevent'>>;
    (data: SendIcsActionData): Promise<CleanSendIcsActionData>;
};

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
        comment?: AttendeeComment;
        updateTime: number;
    };
    silence: boolean;
}

export interface UpdatePersonalPartOperation {
    data: {
        calendarID: string;
        eventID: string;
        eventComponent?: VcalVeventComponent;
        hasDefaultNotifications?: boolean;
        color?: string;
    };
}

export interface AttendeeDeleteSingleEditOperation {
    data: {
        addressID: string;
        calendarID: string;
        eventID: string;
        eventComponent: VcalVeventComponent;
    };
}
