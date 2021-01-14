import { ICAL_ATTENDEE_STATUS, ICAL_METHOD, ICAL_METHODS_ATTENDEE } from 'proton-shared/lib/calendar/constants';
import { c } from 'ttag';

export enum EVENT_INVITATION_ERROR_TYPE {
    INVITATION_INVALID,
    INVITATION_UNSUPPORTED,
    INVALID_METHOD,
    PARSING_ERROR,
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR,
    CANCELLATION_ERROR,
    UNEXPECTED_ERROR,
    EXTERNAL_ERROR,
}

export const getErrorMessage = (errorType: EVENT_INVITATION_ERROR_TYPE, config?: EventInvitationErrorConfig) => {
    const isResponse = config?.method && ICAL_METHODS_ATTENDEE.includes(config?.method);
    if (errorType === EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID) {
        return isResponse
            ? c('Event invitation error').t`Invalid response`
            : c('Event invitation error').t`Invalid invitation`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED) {
        return isResponse
            ? c('Event invitation error').t`Unsupported response`
            : c('Event invitation error').t`Unsupported invitation`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD) {
        if (!config?.method) {
            return c('Event invitation error').t`Invalid method`;
        }
        // Here we invert response <-> invitation as we take the perspective of the sender
        return isResponse
            ? c('Event invitation error').t`Invalid invitation`
            : c('Event invitation error').t`Invalid response`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.PARSING_ERROR) {
        return c('Event invitation error').t`Attached invitation could not be parsed`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.DECRYPTION_ERROR) {
        return c('Event invitation error').t`Attached invitation could not be decrypted`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.FETCHING_ERROR) {
        return c('Event invitation error').t`We could not retrieve the event from your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR) {
        return c('Event invitation error').t`We could not update the event in your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR) {
        return c('Event invitation error').t`Your answer was sent, but the event could not be added to your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.EVENT_UPDATE_ERROR) {
        return c('Event invitation error').t`Your answer was sent, but the event could not be updated in your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR) {
        return c('Event invitation error').t`We could not cancel the event in your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
        return c('Event invitation error').t`Unexpected error`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.EXTERNAL_ERROR) {
        return config?.externalError?.message || '';
    }
    return '';
};

interface EventInvitationErrorConfig {
    externalError?: Error;
    partstat?: ICAL_ATTENDEE_STATUS;
    method?: ICAL_METHOD;
}

export class EventInvitationError extends Error {
    type: EVENT_INVITATION_ERROR_TYPE;

    partstat?: ICAL_ATTENDEE_STATUS;

    externalError?: Error;

    method?: ICAL_METHOD;

    constructor(errorType: EVENT_INVITATION_ERROR_TYPE, config?: EventInvitationErrorConfig) {
        super(getErrorMessage(errorType, config));
        this.type = errorType;
        this.partstat = config?.partstat;
        this.externalError = config?.externalError;
        Object.setPrototypeOf(this, EventInvitationError.prototype);
    }
}
