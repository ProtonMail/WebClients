import { c } from 'ttag';

import {
    IMPORT_ERROR_TYPE,
    MAX_FILENAME_CHARS_DISPLAY,
    MAX_IMPORT_EVENTS_STRING,
    MAX_IMPORT_FILE_SIZE_STRING,
    CALENDAR_APP_NAME,
} from './constants';
import { truncate } from '../helpers/string';

const getErrorMessage = (errorType: IMPORT_ERROR_TYPE, filename = '') => {
    const formattedFilename = `"${truncate(filename, MAX_FILENAME_CHARS_DISPLAY)}"`;
    if (errorType === IMPORT_ERROR_TYPE.NO_FILE_SELECTED) {
        return c('Error importing calendar').t`An error occurred uploading your file. No file has been selected.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.NO_ICS_FILE) {
        return c('Error importing calendar')
            .t`An error occurred uploading your file ${formattedFilename}. Only .ics file formats are allowed.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_EMPTY) {
        return c('Error importing calendar').t`Your file ${formattedFilename} is empty.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_TOO_BIG) {
        return c('Error importing calendar')
            .t`An error occurred uploading your file ${formattedFilename}. Maximum file size is ${MAX_IMPORT_FILE_SIZE_STRING}.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.INVALID_CALENDAR) {
        return c('Error importing calendar').t`Your file ${formattedFilename} is not a calendar.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.INVALID_VERSION) {
        return c('Error importing calendar')
            .t`${CALENDAR_APP_NAME} only supports importing calendars with iCal version 2.0.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.INVALID_METHOD) {
        return c('Error importing calendar').t`Your file ${formattedFilename} is an invitation and cannot be imported.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.NO_EVENTS) {
        return c('Error importing calendar').t`Your file ${formattedFilename} has no events to be imported.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.TOO_MANY_EVENTS) {
        return c('Error importing calendar')
            .t`Your file ${formattedFilename} contains more than ${MAX_IMPORT_EVENTS_STRING} events.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_CORRUPTED) {
        return c('Error importing calendar')
            .t`An error occurred reading your file ${formattedFilename}. File does not have the right format.`;
    }
};

export class ImportFileError extends Error {
    constructor(errorType: IMPORT_ERROR_TYPE, filename?: string) {
        super(getErrorMessage(errorType, filename));
        Object.setPrototypeOf(this, ImportFileError.prototype);
    }
}
