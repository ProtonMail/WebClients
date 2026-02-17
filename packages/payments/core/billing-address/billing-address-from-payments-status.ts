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
 */
export function getBillingAddressFromPaymentStatus(billingAddress: BillingAddress): BillingAddress {
    const normalized = { ...billingAddress };

    restoreDefaultsIfCountryIsMissing(normalized);
    restoreState(normalized);
    restoreZipCode(normalized);
    restorePartialCanadianPostalCode(normalized);

    return normalized;
}

export function getFullBillingAddressFromPaymentStatus(paymentStatus: PaymentStatus): FullBillingAddress {
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
    restoreZipCode(BillingAddress);
    restorePartialCanadianPostalCode(BillingAddress);

    const fullBillingAddress: FullBillingAddress = {
        BillingAddress,
    };

    return fullBillingAddress;
}
