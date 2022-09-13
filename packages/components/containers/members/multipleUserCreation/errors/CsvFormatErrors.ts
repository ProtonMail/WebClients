import { c } from 'ttag';

import { MAX_NUMBER_OF_USER_ROWS } from '../constants';

export class CsvFormatError extends Error {}

export class TooManyUsersError extends Error {
    constructor() {
        super(
            // translator: variable here is the max number of user accounts the user can import. Currently this is 500.
            c('Error importing users').t`Upload a CSV file with ${MAX_NUMBER_OF_USER_ROWS} user accounts or less.`
        );
    }
}
