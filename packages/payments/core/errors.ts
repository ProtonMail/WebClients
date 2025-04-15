import { c } from 'ttag';

/**
 * Errors that can be displayed to the end user.
 */
export class DisplayablePaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DisplayablePaymentError';
    }
}

export class SepaEmailNotProvidedError extends DisplayablePaymentError {
    constructor() {
        super(c('Info').t`SEPA payments are not available at the moment. Please try again later.`);
        this.name = 'SepaEmailNotProvidedError';
    }
}
