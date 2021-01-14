import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { Address } from 'proton-shared/lib/interfaces';
import { VcalAttendeeProperty, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { RECURRING_TYPES } from '../constants';

export enum INVITE_ACTION_TYPES {
    NONE,
    CHANGE_PARTSTAT,
    DECLINE_INVITATION,
    DECLINE_DISABLED,
    SEND_INVITATION,
    SEND_UPDATE,
    CANCEL_INVITATION,
    CANCEL_DISABLED,
}

export interface InviteActions {
    type: INVITE_ACTION_TYPES;
    partstat?: ICAL_ATTENDEE_STATUS;
    sendCancellationNotice?: boolean;
    resetSingleEditsPartstat?: boolean;
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
}

export interface CleanSendIcsActionData extends SendIcsActionData {
    sendPreferencesMap: SimpleMap<SendPreferences>;
}
