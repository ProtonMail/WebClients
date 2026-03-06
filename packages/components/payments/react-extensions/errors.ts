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

export class TaxExemptionNotSupportedError extends PaymentsApiError {
    constructor() {
        super(c('Error').t`Tax exemption is not supported for this plan`);
        this.name = 'TaxExemptionNotSupportedError';
    }
}

export type BillingAddressFieldStatus = 'ok' | 'missing' | 'invalid';

export type BillingAddressValidationResult = {
    CountryCode?: BillingAddressFieldStatus;
    State?: BillingAddressFieldStatus;
    Company?: BillingAddressFieldStatus;
    FirstName?: BillingAddressFieldStatus;
    LastName?: BillingAddressFieldStatus;
    Address?: BillingAddressFieldStatus;
    ZipCode?: BillingAddressFieldStatus;
    City?: BillingAddressFieldStatus;
    VatId?: BillingAddressFieldStatus;
};

export function backendBillingAddressFieldError(status: BillingAddressFieldStatus | undefined): string {
    if (status === 'missing') {
        return c('Error').t`This field is required`;
    }
    if (status === 'invalid') {
        return c('Error').t`This field is invalid`;
    }
    return '';
}

export class WrongBillingAddressError extends PaymentsApiError {
    public validationResult?: BillingAddressValidationResult;

    constructor(validationResult?: BillingAddressValidationResult) {
        super(c('Error').t`Wrong billing address`);
        this.name = 'WrongBillingAddressError';
        this.validationResult = validationResult;
    }
}
