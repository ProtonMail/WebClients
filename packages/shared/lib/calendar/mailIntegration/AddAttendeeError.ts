import { c, msgid } from 'ttag';

import { MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';

export enum ADD_EVENT_ERROR_TYPE {
    TOO_MANY_PARTICIPANTS,
}

const getErrorMessage = (errorType: ADD_EVENT_ERROR_TYPE, maxAttendees = MAX_ATTENDEES) => {
    if (errorType === ADD_EVENT_ERROR_TYPE.TOO_MANY_PARTICIPANTS) {
        return c('Error adding participants to a calendar event').ngettext(
            msgid`At most ${maxAttendees} participant is allowed per invitation`,
            `At most ${maxAttendees} participants are allowed per invitation`,
            maxAttendees
        );
    }
    return '';
};

export class AddAttendeeError extends Error {
    type: ADD_EVENT_ERROR_TYPE;

    externalError?: Error;

    constructor(errorType: ADD_EVENT_ERROR_TYPE, externalError?: Error, maxAttendees?: number) {
        super(getErrorMessage(errorType, maxAttendees));
        this.type = errorType;
        this.externalError = externalError;
        Object.setPrototypeOf(this, AddAttendeeError.prototype);
    }
}
