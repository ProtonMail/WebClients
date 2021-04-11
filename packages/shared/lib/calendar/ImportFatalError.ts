import { c } from 'ttag';

export class ImportFatalError extends Error {
    error: Error;

    constructor(error: Error) {
        super(c('Error importing calendar').t`An unexpected error occurred. Import must be restarted.`);
        this.error = error;
        Object.setPrototypeOf(this, ImportFatalError.prototype);
    }
}
