import { c } from 'ttag';

export const getEventSavedText = (isCreate) => {
    if (isCreate) {
        return c('Success').t`Event created`;
    }
    return c('Success').t`Event updated`;
};

export const getEventDeletedText = () => {
    return c('Success').t`Event deleted`;
};
