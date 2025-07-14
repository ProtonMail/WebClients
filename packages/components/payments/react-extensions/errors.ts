import { c } from 'ttag';

export class PaymentsApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaymentsApiError';
    }
}

export class InvalidZipCodeError extends PaymentsApiError {
    constructor() {
        super(c('Error').t`Invalid ZIP code`);
        this.name = 'InvalidZipCodeError';
    }
}
