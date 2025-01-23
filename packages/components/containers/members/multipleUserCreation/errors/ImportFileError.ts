import { c } from 'ttag';

import truncate from '@proton/utils/truncate';

import { MAX_FILENAME_CHARS_DISPLAY, MAX_IMPORT_FILE_SIZE_STRING } from '../constants';

export enum IMPORT_ERROR_TYPE {
    NO_FILE_SELECTED,
    FILE_EMPTY,
    FILE_TOO_BIG,
    FILE_CORRUPTED,
}

const getImportFileErrorMessage = (errorType: IMPORT_ERROR_TYPE, filename = '') => {
    const formattedFilename = truncate(filename, MAX_FILENAME_CHARS_DISPLAY);
    if (errorType === IMPORT_ERROR_TYPE.NO_FILE_SELECTED) {
        return c('Error importing users').t`An error occurred uploading your file. No file has been selected.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_EMPTY) {
        return c('Error importing users').t`Your file "${formattedFilename}" is empty.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_TOO_BIG) {
        return c('Error importing users')
            .t`An error occurred uploading your file "${formattedFilename}". Maximum file size is ${MAX_IMPORT_FILE_SIZE_STRING}.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_CORRUPTED) {
        return c('Error importing users')
            .t`An error occurred reading your file "${formattedFilename}". Incorrect file format.`;
    }
};

export default class ImportFileError extends Error {
    constructor(errorType: IMPORT_ERROR_TYPE, filename?: string) {
        super(getImportFileErrorMessage(errorType, filename));
        Object.setPrototypeOf(this, ImportFileError.prototype);
    }
}
