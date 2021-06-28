import { c } from 'ttag';

export enum IMPORT_EVENT_ERROR_TYPE {
    WRONG_FORMAT,
    NON_GREGORIAN,
    TODO_FORMAT,
    JOURNAL_FORMAT,
    FREEBUSY_FORMAT,
    TIMEZONE_FORMAT,
    TIMEZONE_IGNORE,
    VEVENT_INVALID,
    VEVENT_UNSUPPORTED,
    FLOATING_TIME,
    ALLDAY_INCONSISTENCY,
    DTSTART_MISSING,
    DTSTART_MALFORMED,
    DTSTART_OUT_OF_BOUNDS,
    DTEND_MALFORMED,
    DTEND_OUT_OF_BOUNDS,
    VEVENT_DURATION,
    X_WR_TIMEZONE_UNSUPPORTED,
    TZID_UNSUPPORTED,
    RRULE_MALFORMED,
    RRULE_UNSUPPORTED,
    SINGLE_EDIT_UNSUPPORTED,
    NOTIFICATION_OUT_OF_BOUNDS,
    VALIDATION_ERROR,
    ENCRYPTION_ERROR,
    PARENT_EVENT_MISSING,
    EXTERNAL_ERROR,
}

const getErrorMessage = (errorType: IMPORT_EVENT_ERROR_TYPE, externalError?: Error) => {
    if (errorType === IMPORT_EVENT_ERROR_TYPE.WRONG_FORMAT) {
        return c('Error importing event').t`Component with wrong format`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.NON_GREGORIAN) {
        return c('Error importing event').t`Non-Gregorian`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.TODO_FORMAT) {
        return c('Error importing event').t`To-do entry`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.JOURNAL_FORMAT) {
        return c('Error importing event').t`Journal entry`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.FREEBUSY_FORMAT) {
        return c('Error importing event').t`Free-busy time information`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.TIMEZONE_FORMAT) {
        return c('Error importing event').t`Custom timezone`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.VEVENT_INVALID) {
        return c('Error importing event').t`Invalid event`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.VEVENT_UNSUPPORTED) {
        return c('Error importing event').t`Unsupported event`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY) {
        return c('Error importing event').t`Malformed all-day event`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.DTSTART_MISSING) {
        return c('Error importing event').t`Missing start time`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.DTSTART_MALFORMED) {
        return c('Error importing event').t`Malformed start time`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.FLOATING_TIME) {
        return c('Error importing event').t`Floating times not supported`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.DTSTART_OUT_OF_BOUNDS) {
        return c('Error importing event').t`Start time out of bounds`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.DTEND_MALFORMED) {
        return c('Error importing event').t`Malformed end time`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.DTEND_OUT_OF_BOUNDS) {
        return c('Error importing event').t`End time out of bounds`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.VEVENT_DURATION) {
        return c('Error importing event').t`Event duration not supported`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED) {
        return c('Error importing event').t`Calendar timezone not supported`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.TZID_UNSUPPORTED) {
        return c('Error importing event').t`Timezone not supported`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.RRULE_MALFORMED) {
        return c('Error importing event').t`Malformed recurring event`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.RRULE_UNSUPPORTED) {
        return c('Error importing event').t`Recurring rule not supported`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED) {
        return c('Error importing event').t`Edited event not supported`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.NOTIFICATION_OUT_OF_BOUNDS) {
        return c('Error importing event').t`Notification out of bounds`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.VALIDATION_ERROR) {
        return c('Error importing event').t`Event validation failed`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.ENCRYPTION_ERROR) {
        return c('Error importing event').t`Encryption failed`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.PARENT_EVENT_MISSING) {
        return c('Error importing event').t`Original recurring event could not be found`;
    }
    if (errorType === IMPORT_EVENT_ERROR_TYPE.EXTERNAL_ERROR) {
        return externalError?.message || '';
    }
    return '';
};

export class ImportEventError extends Error {
    component: string;

    componentId: string;

    type: IMPORT_EVENT_ERROR_TYPE;

    externalError?: Error;

    constructor(errorType: IMPORT_EVENT_ERROR_TYPE, component: string, componentId: string, externalError?: Error) {
        super(getErrorMessage(errorType, externalError));
        this.type = errorType;
        this.component = component;
        this.componentId = componentId;
        this.externalError = externalError;
        Object.setPrototypeOf(this, ImportEventError.prototype);
    }
}
