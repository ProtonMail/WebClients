import { c } from 'ttag';

import { getStandaloneUnleashClient } from '@proton/unleash';
import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import truncate from '@proton/utils/truncate';

import { MAX_CONTACTS_PER_USER, MAX_FILENAME_CHARS_DISPLAY, MAX_IMPORT_FILE_SIZE_STRING } from '../constants';

export enum IMPORT_ERROR_TYPE {
    NO_FILE_SELECTED,
    NO_CSV_OR_VCF_FILE,
    FILE_EMPTY,
    FILE_TOO_BIG,
    FILE_CORRUPTED,
    NO_CONTACTS,
    TOO_MANY_CONTACTS,
}

const getErrorMessage = (errorType: IMPORT_ERROR_TYPE, filename = '') => {
    const unleashClient = getStandaloneUnleashClient();

    let maxContactString = MAX_CONTACTS_PER_USER.toLocaleString();

    if (unleashClient && unleashClient.isEnabled(CommonFeatureFlag.MaxContactsImport)) {
        const config = unleashClient.getVariant(CommonFeatureFlag.MaxContactsImport).payload?.value;

        if (config) {
            const configParsed = JSON.parse(config);
            maxContactString = configParsed.maxContactsImport.toLocaleString();
        }
    }

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
