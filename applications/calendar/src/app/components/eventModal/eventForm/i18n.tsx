import { c } from 'ttag';
import { getOccurrences } from 'proton-shared/lib/calendar/recurring';

import { RECURRING_TYPES } from '../../../constants';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';

export const getEventCreatedText = () => {
    return c('Success').t`Event created`;
};

export const getEventUpdatedText = () => {
    return c('Success').t`Event updated`;
};

export const getEventDeletedText = () => {
    return c('Success').t`Event deleted`;
};

export const getRecurringEventCreatedText = () => {
    return c('Success').t`Events created`;
};

export const getRecurringEventUpdatedText = (saveType: RECURRING_TYPES) => {
    if (saveType === RECURRING_TYPES.SINGLE) {
        return getEventUpdatedText();
    }
    if (saveType === RECURRING_TYPES.FUTURE) {
        return c('Success').t`Future events updated`;
    }
    return c('Success').t`All events updated`;
};

export const getRecurringEventDeletedText = (deleteType: RECURRING_TYPES) => {
    if (deleteType === RECURRING_TYPES.SINGLE) {
        return getEventDeletedText();
    }
    if (deleteType === RECURRING_TYPES.FUTURE) {
        return c('Success').t`Future events deleted`;
    }
    return c('Success').t`All events deleted`;
};

export const getSingleEventText = (oldEventData: EventOldData | undefined, newEventData: EventNewData) => {
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
    return getEventUpdatedText();
};
