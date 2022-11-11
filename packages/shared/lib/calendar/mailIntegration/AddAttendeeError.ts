import { c, msgid } from 'ttag';

import { MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';

export enum ADD_EVENT_ERROR_TYPE {
    TOO_MANY_PARTICIPANTS,
}

const getErrorMessage = (errorType: ADD_EVENT_ERROR_TYPE) => {
    if (errorType === ADD_EVENT_ERROR_TYPE.TOO_MANY_PARTICIPANTS) {
        return c('Error adding participants to a calendar event').ngettext(
            msgid`At most ${MAX_ATTENDEES} participant is allowed per invitation`,
            `At most ${MAX_ATTENDEES} participants are allowed per invitation`,
            MAX_ATTENDEES
        );
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
