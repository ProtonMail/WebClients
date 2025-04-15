/**
 * Errors that can be displayed to the end user.
 */
export class DisplayablePaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DisplayablePaymentError';
    }
}
