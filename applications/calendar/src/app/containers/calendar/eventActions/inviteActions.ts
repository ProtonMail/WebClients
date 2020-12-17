import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { RECURRING_TYPES } from '../../../constants';

export enum INVITE_ACTION_TYPES {
    NONE,
    CHANGE_PARTSTAT,
    DECLINE,
}

export interface InviteActions {
    type: INVITE_ACTION_TYPES;
    partstat?: ICAL_ATTENDEE_STATUS;
    sendCancellationNotice?: boolean;
    resetSingleEditsPartstat?: boolean;
}

export const NO_INVITE_ACTION = {
    type: INVITE_ACTION_TYPES.NONE,
};

export interface RecurringActionData {
    type: RECURRING_TYPES;
    inviteActions: InviteActions;
}
