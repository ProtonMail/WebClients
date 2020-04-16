import { c } from 'ttag';
import { RECURRING_TYPES } from '../../../constants';

export const getEventCreatedText = () => {
    return c('Success').t`Event created`;
};

export const getEventUpdatedText = () => {
    return c('Success').t`Event updated`;
};

export const getEventDeletedText = () => {
    return c('Success').t`Event deleted`;
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
