import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';

export enum INVITE_ACTION_TYPES {
    NONE,
    CHANGE_PARTSTAT,
    DECLINE,
}

export interface InviteActions {
    type: INVITE_ACTION_TYPES;
    partstat?: ICAL_ATTENDEE_STATUS;
    sendCancellationNotice?: boolean;
}

export const NO_INVITE_ACTION = {
    type: INVITE_ACTION_TYPES.NONE,
};
