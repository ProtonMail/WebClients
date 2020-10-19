import { getOccurrences } from 'proton-shared/lib/calendar/recurring';
import { c } from 'ttag';

import { RECURRING_TYPES } from '../../../constants';
import { INVITE_ACTION_TYPES, InviteActions } from '../../../containers/calendar/eventActions/inviteActions';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';

export const getEventCreatedText = () => {
    return c('Success').t`Event created`;
};

export const getEventUpdatedText = (inviteActions?: InviteActions) => {
    if (inviteActions?.type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
        return c('Success').t`Participation status updated`;
    }
    return c('Success').t`Event updated`;
};

export const getEventDeletedText = (sendCancellationNotice = false) => {
    return sendCancellationNotice ? c('Success').t`Answer sent and event deleted` : c('Success').t`Event deleted`;
};

export const getRecurringEventCreatedText = () => {
    return c('Success').t`Events created`;
};

export const getRecurringEventUpdatedText = (saveType: RECURRING_TYPES, inviteActions?: InviteActions) => {
    if (saveType === RECURRING_TYPES.SINGLE) {
        return getEventUpdatedText(inviteActions);
    }
    if (saveType === RECURRING_TYPES.FUTURE) {
        return c('Success').t`Future events updated`;
    }
    return inviteActions?.type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT
        ? c('Success').t`Participation status updated for all events`
        : c('Success').t`All events updated`;
};

export const getRecurringEventDeletedText = (deleteType: RECURRING_TYPES, sendCancellationNotice = false) => {
    if (deleteType === RECURRING_TYPES.SINGLE) {
        return getEventDeletedText(sendCancellationNotice);
    }
    if (deleteType === RECURRING_TYPES.FUTURE) {
        return sendCancellationNotice
            ? c('Success').t`Answer sent and future events deleted`
            : c('Success').t`Future events deleted`;
    }
    return sendCancellationNotice
        ? c('Success').t`Answer sent and all events deleted`
        : c('Success').t`All events deleted`;
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
            return getEventCreatedText();
        }
        return getRecurringEventCreatedText();
    }
    if (isCreate) {
        return getEventCreatedText();
    }
    return getEventUpdatedText(inviteActions);
};
