import { c } from 'ttag';

import { MAX_NUMBER_OF_USER_ROWS } from '../constants';

export enum CSV_FORMAT_ERROR_TYPE {
    MISSING_REQUIRED_FIELD,
    PARSED_CSV_ERRORS,
}

const getCsvFormatErrorMessage = (options: CsvFormatErrorOptions) => {
    if (options.type === CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD) {
        return c('CSV format error').t`It looks like your file is missing the '${options.fieldName}' header.`;
    }
    if (options.type === CSV_FORMAT_ERROR_TYPE.PARSED_CSV_ERRORS) {
        if (options.rowsThatErrored.length > 3) {
            return c('CSV format error')
                .t`We detected errors in multiple rows during import, please review your CSV file.`;
        }

        const erroredRowsString = options.rowsThatErrored.join(', ');
        return c('CSV format error').t`Error on row ${erroredRowsString}.`;
    }
};

type CsvFormatErrorOptions =
    | { type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD; fieldName: string }
    | { type: CSV_FORMAT_ERROR_TYPE.PARSED_CSV_ERRORS; rowsThatErrored: string[] };

export class CsvFormatError extends Error {
    constructor(options: CsvFormatErrorOptions) {
        super(getCsvFormatErrorMessage(options));
    }
}

export class TooManyUsersError extends Error {
    constructor() {
        super(
            // translator: variable here is the max number of user accounts the user can import. Currently this is 500.
            c('Error importing users').t`Upload a CSV file with ${MAX_NUMBER_OF_USER_ROWS} user accounts or less.`
        );
    }
}
