import { c } from 'ttag';

export enum EVENT_INVITATION_ERROR_TYPE {
    MISSING_ATTENDEE,
    INVITATION_INVALID,
    INVITATION_UNSUPPORTED,
    PARSING_ERROR,
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    CANCELLATION_ERROR,
    EXTERNAL_ERROR
}

export const getErrorMessage = (errorType: EVENT_INVITATION_ERROR_TYPE, externalError?: Error) => {
    if (errorType === EVENT_INVITATION_ERROR_TYPE.MISSING_ATTENDEE) {
        return c('Event invitation error').t`Missing attendee`;
    }
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
    if (errorType === EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR) {
        return c('Event invitation error').t`We could not cancel the event in your calendar`;
    }
    if (errorType === EVENT_INVITATION_ERROR_TYPE.EXTERNAL_ERROR) {
        return externalError?.message || '';
    }
    return '';
};

export class EventInvitationError extends Error {
    type: EVENT_INVITATION_ERROR_TYPE;

    externalError?: Error;

    constructor(errorType: EVENT_INVITATION_ERROR_TYPE, externalError?: Error) {
        super(getErrorMessage(errorType, externalError));
        this.type = errorType;
        this.externalError = externalError;
        Object.setPrototypeOf(this, EventInvitationError.prototype);
    }
}
