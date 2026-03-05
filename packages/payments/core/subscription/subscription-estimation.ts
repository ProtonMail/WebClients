import type { BillingAddressValidationResult } from '@proton/components/payments/react-extensions/errors';
import { WrongBillingAddressError } from '@proton/components/payments/react-extensions/errors';

import type { SubscriptionEstimation } from './interface';

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
