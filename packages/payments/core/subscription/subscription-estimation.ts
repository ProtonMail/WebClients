import type { BillingAddressValidationResult } from '@proton/components/payments/react-extensions/errors';
import {
    InvalidZipCodeError,
    TaxExemptionNotSupportedError,
    WrongBillingAddressError,
} from '@proton/components/payments/react-extensions/errors';

import type { SubscriptionEstimation } from './interface';

export function hasInvalidZipCodeError(estimation: SubscriptionEstimation | undefined): boolean {
    return estimation?.error instanceof InvalidZipCodeError;
}

export function hasTaxExemptionNotSupportedError(estimation: SubscriptionEstimation | undefined): boolean {
    return estimation?.error instanceof TaxExemptionNotSupportedError;
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

export function hasSubscriptionEstimationError(estimation: SubscriptionEstimation | undefined): boolean {
    return (
        hasInvalidZipCodeError(estimation) ||
        hasTaxExemptionNotSupportedError(estimation) ||
        hasWrongBillingAddressError(estimation)
    );
}
