import { c } from 'ttag';

import type { SubscriptionEstimation } from './subscription/interface';

/**
 * Errors that can be displayed to the end user.
 */
export class DisplayablePaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DisplayablePaymentError';
    }
}

export class PaymentsApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaymentsApiError';
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

export function hasInvalidZipCodeError(estimation: SubscriptionEstimation | undefined): boolean {
    if (estimation?.error instanceof WrongBillingAddressError) {
        return estimation.error.validationResult?.ZipCode !== 'ok';
    }

    return false;
}

export function hasWrongBillingAddressError(estimation: SubscriptionEstimation | undefined): boolean {
    return estimation?.error instanceof WrongBillingAddressError;
}

export function getWrongBillingAddressValidationResult(
    estimation: SubscriptionEstimation | undefined
): BillingAddressValidationResult | undefined {
    if (estimation?.error instanceof WrongBillingAddressError) {
        return estimation.error.validationResult;
    }
    return undefined;
}

export class InvalidCouponError extends PaymentsApiError {
    constructor() {
        super(c('Error').t`Invalid coupon`);
        this.name = 'InvalidCouponError';
    }
}
