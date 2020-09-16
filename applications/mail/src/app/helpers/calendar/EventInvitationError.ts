import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { c } from 'ttag';

export enum EVENT_INVITATION_ERROR_TYPE {
    INVITATION_INVALID,
    INVITATION_UNSUPPORTED,
    PARSING_ERROR,
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    EVENT_CREATION_ERROR,
    CANCELLATION_ERROR,
    UNEXPECTED_ERROR,
    EXTERNAL_ERROR
}

export const getErrorMessage = (errorType: EVENT_INVITATION_ERROR_TYPE, externalError?: Error) => {
    if (errorType === EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID) {
        return c('Event invitation error').t`Invalid invitation`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED) {
        return c('Event invitation error').t`Unsupported invitation`;
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
        return c('Event invitation error')
            .t`Your answer has been sent but we could not create the event in your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR) {
        return c('Event invitation error').t`We could not cancel the event in your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
        return c('Event invitation error').t`Unexpected error`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.EXTERNAL_ERROR) {
        return externalError?.message || '';
    }
    return '';
};

interface EventInvitationErrorConfig {
    externalError?: Error;
    partstat?: ICAL_ATTENDEE_STATUS;
}

export class EventInvitationError extends Error {
    type: EVENT_INVITATION_ERROR_TYPE;

    partstat?: ICAL_ATTENDEE_STATUS;

    externalError?: Error;

    constructor(errorType: EVENT_INVITATION_ERROR_TYPE, config?: EventInvitationErrorConfig) {
        super(getErrorMessage(errorType, config?.externalError));
        this.type = errorType;
        this.partstat = config?.partstat;
        this.externalError = config?.externalError;
        Object.setPrototypeOf(this, EventInvitationError.prototype);
    }
}
