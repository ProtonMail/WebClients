import { c } from 'ttag';

import truncate from '@proton/utils/truncate';

import { MAX_FILENAME_CHARS_DISPLAY, MAX_IMPORT_FILE_SIZE_STRING } from '../constants';
import { getMaxContactsImportConfig } from '../maxContactsImportConfig';

export enum IMPORT_ERROR_TYPE {
    NO_FILE_SELECTED = 0,
    NO_CSV_OR_VCF_FILE = 1,
    FILE_EMPTY = 2,
    FILE_TOO_BIG = 3,
    FILE_CORRUPTED = 4,
    NO_CONTACTS = 5,
    TOO_MANY_CONTACTS = 6,
}

const getErrorMessage = (errorType: IMPORT_ERROR_TYPE, filename = '') => {
    const maxContacts = getMaxContactsImportConfig();
    const maxContactString = maxContacts.toLocaleString();

    const formattedFilename = `"${truncate(filename, MAX_FILENAME_CHARS_DISPLAY)}"`;
    if (errorType === IMPORT_ERROR_TYPE.NO_FILE_SELECTED) {
        return c('Error importing contacts').t`An error occurred uploading your file. No file has been selected.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.NO_CSV_OR_VCF_FILE) {
        return c('Error importing contacts')
            .t`An error occurred uploading your file ${formattedFilename}. No .csv or .vcf file selected`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_EMPTY) {
        return c('Error importing contacts').t`Your file ${formattedFilename} is empty.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_TOO_BIG) {
        return c('Error importing contacts')
            .t`An error occurred uploading your file ${formattedFilename}. Maximum file size is ${MAX_IMPORT_FILE_SIZE_STRING}.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.NO_CONTACTS) {
        return c('Error importing contacts').t`Your file ${formattedFilename} has no contacts to be imported.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.TOO_MANY_CONTACTS) {
        return c('Error importing contacts')
            .t`Your file ${formattedFilename} contains more than ${maxContactString} contacts.`;
    }
    if (errorType === IMPORT_ERROR_TYPE.FILE_CORRUPTED) {
        return c('Error importing contacts')
            .t`An error occurred reading your file ${formattedFilename}. Incorrect file format.`;
    }
};

export class ImportFileError extends Error {
    constructor(errorType: IMPORT_ERROR_TYPE, filename?: string) {
        super(getErrorMessage(errorType, filename));
        Object.setPrototypeOf(this, ImportFileError.prototype);
    }
}
