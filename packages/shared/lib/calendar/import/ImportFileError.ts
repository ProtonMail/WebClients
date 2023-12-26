import { c, msgid } from 'ttag';

import truncate from '@proton/utils/truncate';

import {
    IMPORT_ERROR_TYPE,
    MAX_FILENAME_CHARS_DISPLAY,
    MAX_IMPORT_EVENTS,
    MAX_IMPORT_EVENTS_STRING,
    MAX_IMPORT_FILE_SIZE_STRING,
} from '../constants';

const getErrorMessage = (errorType: IMPORT_ERROR_TYPE, filename = '') => {
    const formattedFilename = `"${truncate(filename, MAX_FILENAME_CHARS_DISPLAY)}"`;
    if (errorType === IMPORT_ERROR_TYPE.NO_FILE_SELECTED) {
        return c('Error importing calendar').t`An error occurred uploading your file. No file has been selected.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.NO_ICS_FILE) {
        return c('Error importing calendar')
            .t`An error occurred uploading your file ${formattedFilename}. Only ICS file formats are allowed.`;
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
    if (errorType === IMPORT_ERROR_TYPE.INVALID_METHOD) {
        return c('Error importing calendar')
            .t`Your file ${formattedFilename} has an invalid method and cannot be imported.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.NO_EVENTS) {
        return c('Error importing calendar').t`Your file ${formattedFilename} has no events to be imported.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.TOO_MANY_EVENTS) {
        return c('Error importing calendar').ngettext(
            msgid`Your file ${formattedFilename} contains more than ${MAX_IMPORT_EVENTS_STRING} event.`,
            `Your file ${formattedFilename} contains more than ${MAX_IMPORT_EVENTS_STRING} events.`,
            MAX_IMPORT_EVENTS
        );
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_CORRUPTED) {
        return c('Error importing calendar')
            .t`An error occurred reading your file ${formattedFilename}. Incorrect file format.`;
    }
};

export class ImportFileError extends Error {
    constructor(errorType: IMPORT_ERROR_TYPE, filename?: string) {
        super(getErrorMessage(errorType, filename));
        Object.setPrototypeOf(this, ImportFileError.prototype);
    }
}
