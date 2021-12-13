import { c } from 'ttag';

export enum ADD_EVENT_ERROR_TYPE {
    TOO_MANY_PARTICIPANTS,
}

const getErrorMessage = (errorType: ADD_EVENT_ERROR_TYPE) => {
    if (errorType === ADD_EVENT_ERROR_TYPE.TOO_MANY_PARTICIPANTS) {
        return c('Error adding participants to a calendar event')
            .t`At most 100 participants are allowed per invitation`;
    }
    return '';
};

export class AddAttendeeError extends Error {
    type: ADD_EVENT_ERROR_TYPE;

    externalError?: Error;

    constructor(errorType: ADD_EVENT_ERROR_TYPE, externalError?: Error) {
        super(getErrorMessage(errorType));
        this.type = errorType;
        this.externalError = externalError;
        Object.setPrototypeOf(this, AddAttendeeError.prototype);
    }
}
