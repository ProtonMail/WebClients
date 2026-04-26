import { getDefaultPostalCodeByStateCode } from '../../postal-codes/default-postal-codes';
import { getStateCodeByPostalCode, isPostalCodeValid } from '../../postal-codes/postal-codes-validation';
import { getDefaultState, isCountryWithRequiredPostalCode, isCountryWithStates } from '../countries';
import type { PaymentStatus } from '../interface';
import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS, type FullBillingAddress } from './billing-address';

function restoreDefaultsIfCountryIsMissing(normalized: BillingAddress): void {
    if (!normalized.CountryCode) {
        normalized.CountryCode = DEFAULT_TAX_BILLING_ADDRESS.CountryCode;
        normalized.State = DEFAULT_TAX_BILLING_ADDRESS.State;
        normalized.ZipCode = DEFAULT_TAX_BILLING_ADDRESS.ZipCode;
    }
}

function restoreState(normalized: BillingAddress): void {
    if (isCountryWithStates(normalized.CountryCode) && !normalized.State) {
        if (normalized.ZipCode) {
            const stateByZipCode = getStateCodeByPostalCode(normalized.CountryCode, normalized.ZipCode);
            if (stateByZipCode) {
                normalized.State = stateByZipCode;
            } else {
                normalized.State = getDefaultState(normalized.CountryCode);
                normalized.ZipCode = null;
            }
        } else {
            normalized.State = getDefaultState(normalized.CountryCode);
        }
    }
}

function restoreZipCode(normalized: BillingAddress): void {
    if (isCountryWithRequiredPostalCode(normalized.CountryCode) && normalized.State && !normalized.ZipCode) {
        normalized.ZipCode = getDefaultPostalCodeByStateCode(normalized.CountryCode, normalized.State);
    }
}

function restorePartialCanadianPostalCode(normalized: BillingAddress): void {
    if (
        normalized.CountryCode === 'CA' &&
        normalized.State &&
        normalized.ZipCode &&
        !isPostalCodeValid(normalized.CountryCode, normalized.State, normalized.ZipCode) &&
        normalized.ZipCode.length === 3
    ) {
        normalized.ZipCode = normalized.ZipCode + ' 0A0';
    }
}

/**
 * Implements a set of fallbacks in case the backend doesn't return the complete billing address.
 *
 * @param shouldRestoreZipCode - Whether to restore the ZIP code if it is missing. ZIP code can be missing in two cases:
 * 1) if it's a signup flow, and the ZIP code detection didn't work properly (payment status endpoint didn't return it)
 * 2) there is a cohort of existing US/CA users who are supposed to have ZIP code, but they still don't have it. It's
 *    not expected behavior, but FE needs to recover from it.
 *
 * Case 1: user is unauthenticated - pass shouldRestoreZipCode: true, because in this case we will make the checkout
 * smoother, while nothing in the UI will break.
 *
 * Case 2: user is authenticated - pass shouldRestoreZipCode: false, because otherwise UI can be inconsistent. For
 * example, if ZIP code is restored then the billing country selector displays the restored ZIP code. However since the
 * `subscription/check` endpoint is stateful and reads the previously saved billing address, it can return an error that
 * the ZIP code is invalid/missing. The solution is not to do optimistic ZIP code restoration in this case.
 */
export function getBillingAddressFromPaymentStatus(
    billingAddress: BillingAddress,
    { shouldRestoreZipCode }: { shouldRestoreZipCode: boolean }
): BillingAddress {
    const normalized = { ...billingAddress };

    restoreDefaultsIfCountryIsMissing(normalized);
    restoreState(normalized);
    if (shouldRestoreZipCode) {
        restoreZipCode(normalized);
        restorePartialCanadianPostalCode(normalized);
    }
    return normalized;
}

export function getFullBillingAddressFromPaymentStatus(
    paymentStatus: PaymentStatus,
    { shouldRestoreZipCode }: { shouldRestoreZipCode: boolean }
): FullBillingAddress {
    const CountryCode = paymentStatus.CountryCode;
    const State = paymentStatus.State;
    const ZipCode = paymentStatus.ZipCode;

    const BillingAddress: BillingAddress = {
        CountryCode,
        State,
        ZipCode,
    };

    restoreDefaultsIfCountryIsMissing(BillingAddress);
    restoreState(BillingAddress);
    if (shouldRestoreZipCode) {
        restoreZipCode(BillingAddress);
        restorePartialCanadianPostalCode(BillingAddress);
    }

    const fullBillingAddress: FullBillingAddress = {
        BillingAddress,
    };

    return fullBillingAddress;
}
