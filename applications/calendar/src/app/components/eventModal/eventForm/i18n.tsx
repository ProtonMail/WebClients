import { getOccurrences } from '@proton/shared/lib/calendar/recurring';
import { c } from 'ttag';

import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';

export const getEventCreatedText = (inviteActions: InviteActions) => {
    const { type } = inviteActions;
    if (type === INVITE_ACTION_TYPES.SEND_INVITATION) {
        return c('Success').t`Invitation sent and event created`;
    }
    return c('Success').t`Event created`;
};

export const getEventUpdatedText = (inviteActions: InviteActions) => {
    const { type, addedAttendees, removedAttendees } = inviteActions;
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    if (type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
        return c('Success').t`Participation status updated`;
    }
    if (type === INVITE_ACTION_TYPES.SEND_INVITATION) {
        if (hasAddedAttendees && hasRemovedAttendees) {
            return c('Success').t`Participants notified and changes saved`;
        }
        if (hasAddedAttendees) {
            return c('Success').t`Invitation sent and participants added`;
        }
        if (hasRemovedAttendees) {
            return c('Success').t`Cancellation sent and participants removed`;
        }
        return c('Success').t`Participants notified and event updated`;
    }
    if (type === INVITE_ACTION_TYPES.SEND_UPDATE) {
        return c('Success').t`Participants notified and event updated`;
    }
    return c('Success').t`Event updated`;
};

export const getEventDeletedText = ({ type, sendCancellationNotice }: InviteActions) => {
    if (type === INVITE_ACTION_TYPES.CANCEL_INVITATION) {
        return c('Success').t`Cancellation sent and event deleted`;
    }
    if (type === INVITE_ACTION_TYPES.DECLINE_INVITATION && sendCancellationNotice) {
        return c('Success').t`Answer sent and event deleted`;
    }
    return c('Success').t`Event deleted`;
};

export const getRecurringEventCreatedText = (inviteActions: InviteActions) => {
    if (inviteActions.type === INVITE_ACTION_TYPES.SEND_INVITATION) {
        return c('Success').t`Invitation sent and events created`;
    }
    return c('Success').t`Events created`;
};

export const getRecurringEventUpdatedText = (saveType: RECURRING_TYPES, inviteActions: InviteActions) => {
    const { type: inviteType, addedAttendees, removedAttendees } = inviteActions;
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    if (saveType === RECURRING_TYPES.SINGLE) {
        return getEventUpdatedText(inviteActions);
    }
    if (saveType === RECURRING_TYPES.FUTURE) {
        return c('Success').t`Future events updated`;
    }
    if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
        return c('Success').t`Participation status updated for all events`;
    }
    if (inviteType === INVITE_ACTION_TYPES.SEND_INVITATION) {
        if (hasAddedAttendees && hasRemovedAttendees) {
            return c('Success').t`Participants notified and all events updated`;
        }
        if (hasAddedAttendees) {
            return c('Success').t`Invitation sent and participants added to all events`;
        }
        if (hasRemovedAttendees) {
            return c('Success').t`Cancellation sent and participants removed from all events`;
        }
        // should never fall here
        return c('Success').t`Invitation sent and all events updated`;
    }
    if (inviteType === INVITE_ACTION_TYPES.SEND_UPDATE) {
        return c('Success').t`Participants notified and all events updated`;
    }
    return c('Success').t`All events updated`;
};

export const getRecurringEventDeletedText = (deleteType: RECURRING_TYPES, inviteActions: InviteActions) => {
    const { type, sendCancellationNotice } = inviteActions;
    if (deleteType === RECURRING_TYPES.SINGLE) {
        return getEventDeletedText(inviteActions);
    }
    if (deleteType === RECURRING_TYPES.FUTURE) {
        return c('Success').t`Future events deleted`;
    }
    if (type === INVITE_ACTION_TYPES.CANCEL_INVITATION) {
        return c('Success').t`Cancellation sent and all events deleted`;
    }
    if (type === INVITE_ACTION_TYPES.DECLINE_INVITATION && sendCancellationNotice) {
        return c('Success').t`Answer sent and all events deleted`;
    }
    return c('Success').t`All events deleted`;
};

export const getSingleEventText = (
    oldEventData: EventOldData | undefined,
    newEventData: EventNewData,
    inviteActions: InviteActions
) => {
    const isCreate = !oldEventData?.eventData;
    const isRecurring = newEventData.veventComponent.rrule;

    if (isCreate && isRecurring) {
        const twoOccurrences = getOccurrences({
            component: newEventData.veventComponent,
            maxCount: 2,
        });
        if (twoOccurrences.length === 1) {
            return getEventCreatedText(inviteActions);
        }
        return getRecurringEventCreatedText(inviteActions);
    }
    if (isCreate) {
        return getEventCreatedText(inviteActions);
    }
    return getEventUpdatedText(inviteActions);
};
