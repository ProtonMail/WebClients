import { c } from 'ttag';

export enum IMPORT_EVENT_TYPE {
    WRONG_FORMAT,
    NON_GREGORIAN,
    TODO_FORMAT,
    JOURNAL_FORMAT,
    FREEBUSY_FORMAT,
    TIMEZONE_FORMAT,
    UID_MISSING,
    ALLDAY_INCONSISTENCY,
    DTSTART_MISSING,
    DTSTART_MALFORMED,
    DTSTART_OUT_OF_BOUNDS,
    DTEND_MISSING,
    DTEND_MALFORMED,
    DTEND_OUT_OF_BOUNDS,
    TZID_UNSUPPORTED,
    NEGATIVE_DURATION,
    RRULE_INCONSISTENT,
    RRULE_UNSUPPORTED,
    NOTIFICATION_OUT_OF_BOUNDS,
    VALIDATION_ERROR,
    ENCRYPTION_ERROR
}

const getErrorMessage = (errorType: IMPORT_EVENT_TYPE) => {
    if (errorType === IMPORT_EVENT_TYPE.WRONG_FORMAT) {
        return c('Error importing event').t`Component with wrong format`;
    }
    if (errorType === IMPORT_EVENT_TYPE.NON_GREGORIAN) {
        return c('Error importing event').t`Non-Gregorian calendar`;
    }
    if (errorType === IMPORT_EVENT_TYPE.TODO_FORMAT) {
        return c('Error importing event').t`To-do format`;
    }
    if (errorType === IMPORT_EVENT_TYPE.JOURNAL_FORMAT) {
        return c('Error importing event').t`Journal format`;
    }
    if (errorType === IMPORT_EVENT_TYPE.FREEBUSY_FORMAT) {
        return c('Error importing event').t`Free-busy format`;
    }
    if (errorType === IMPORT_EVENT_TYPE.TIMEZONE_FORMAT) {
        return c('Error importing event').t`Timezone format`;
    }
    if (errorType === IMPORT_EVENT_TYPE.UID_MISSING) {
        return c('Error importing event').t`Missing UID`;
    }
    if (errorType === IMPORT_EVENT_TYPE.ALLDAY_INCONSISTENCY) {
        return c('Error importing event').t`Malformed all-day event`;
    }
    if (errorType === IMPORT_EVENT_TYPE.DTSTART_MISSING) {
        return c('Error importing event').t`Missing start time`;
    }
    if (errorType === IMPORT_EVENT_TYPE.DTSTART_MALFORMED) {
        return c('Error importing event').t`Malformed start time`;
    }
    if (errorType === IMPORT_EVENT_TYPE.DTSTART_OUT_OF_BOUNDS) {
        return c('Error importing event').t`Start time out of bounds`;
    }
    if (errorType === IMPORT_EVENT_TYPE.DTEND_MISSING) {
        return c('Error importing event').t`Missing end time`;
    }
    if (errorType === IMPORT_EVENT_TYPE.DTEND_MALFORMED) {
        return c('Error importing event').t`Malformed end time`;
    }
    if (errorType === IMPORT_EVENT_TYPE.DTEND_OUT_OF_BOUNDS) {
        return c('Error importing event').t`End time out of bounds`;
    }
    if (errorType === IMPORT_EVENT_TYPE.TZID_UNSUPPORTED) {
        return c('Error importing event').t`Unsupported timezone`;
    }
    if (errorType === IMPORT_EVENT_TYPE.NEGATIVE_DURATION) {
        return c('Error importing event').t`Negative duration`;
    }
    if (errorType === IMPORT_EVENT_TYPE.RRULE_INCONSISTENT) {
        return c('Error importing event').t`Recurring rule inconsistent`;
    }
    if (errorType === IMPORT_EVENT_TYPE.RRULE_UNSUPPORTED) {
        return c('Error importing event').t`Recurring rule not supported`;
    }
    if (errorType === IMPORT_EVENT_TYPE.NOTIFICATION_OUT_OF_BOUNDS) {
        return c('Error importing event').t`Notification out of bounds`;
    }
    if (errorType === IMPORT_EVENT_TYPE.VALIDATION_ERROR) {
        return c('Error importing event').t`Event validation failed`;
    }
    if (errorType === IMPORT_EVENT_TYPE.ENCRYPTION_ERROR) {
        return c('Error importing event').t`Encryption failed`;
    }
};

export class ImportEventError extends Error {
    component: string;
    idMessage: string;
    constructor(errorType: IMPORT_EVENT_TYPE, component: string, idMessage: string) {
        super(getErrorMessage(errorType));
        this.component = component;
        this.idMessage = idMessage;
        Object.setPrototypeOf(this, ImportEventError.prototype);
    }
}

export class ImportEventGeneralError extends Error {
    error: Error;
    component: string;
    idMessage: string;
    constructor(error: Error, component: string, idMessage: string) {
        super(error.message);
        this.error = error;
        this.component = component;
        this.idMessage = idMessage;
        Object.setPrototypeOf(this, ImportEventGeneralError.prototype);
    }
}
