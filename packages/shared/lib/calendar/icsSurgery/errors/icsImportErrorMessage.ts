import { c } from 'ttag';

import { IMPORT_EVENT_ERROR_TYPE } from './icsSurgeryErrorTypes';

export const getICSImportErrorMessage = (errorType: IMPORT_EVENT_ERROR_TYPE, externalError?: Error) => {
    switch (errorType) {
        case IMPORT_EVENT_ERROR_TYPE.WRONG_FORMAT:
            return c('Error importing event').t`Component with wrong format`;
        case IMPORT_EVENT_ERROR_TYPE.TODO_FORMAT:
            return c('Error importing event').t`To-do entry`;
        case IMPORT_EVENT_ERROR_TYPE.JOURNAL_FORMAT:
            return c('Error importing event').t`Journal entry`;
        case IMPORT_EVENT_ERROR_TYPE.FREEBUSY_FORMAT:
            return c('Error importing event').t`Free-busy time information`;
        case IMPORT_EVENT_ERROR_TYPE.TIMEZONE_FORMAT:
            return c('Error importing event').t`Custom time zone`;
        case IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE:
            return c('Error importing event').t`Time zone component ignored`;
        case IMPORT_EVENT_ERROR_TYPE.VEVENT_INVALID:
            return c('Error importing event').t`Invalid event`;
        case IMPORT_EVENT_ERROR_TYPE.VEVENT_UNSUPPORTED:
            return c('Error importing event').t`Unsupported event`;
        case IMPORT_EVENT_ERROR_TYPE.DTSTART_MISSING:
            return c('Error importing event').t`Missing start time`;
        case IMPORT_EVENT_ERROR_TYPE.NOTIFICATION_OUT_OF_BOUNDS:
            return c('Error importing event').t`Notification out of bounds`;
        case IMPORT_EVENT_ERROR_TYPE.ENCRYPTION_ERROR:
            return c('Error importing event').t`Encryption failed`;
        case IMPORT_EVENT_ERROR_TYPE.PARENT_EVENT_MISSING:
            return c('Error importing event').t`Original recurring event could not be found`;
        case IMPORT_EVENT_ERROR_TYPE.EXTERNAL_ERROR:
            return externalError?.message || '';
    }

    return '';
};
