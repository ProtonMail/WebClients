import { c } from 'ttag';

import { getDefaultPostalCodeByStateCode } from '../postal-codes/default-postal-codes';
import { normalizePostalCode } from '../postal-codes/format';
import { getStateCodeByPostalCode, isPostalCodeValid } from '../postal-codes/postal-codes-validation';
import { getDefaultState, isCountryWithRequiredPostalCode, isCountryWithStates } from './countries';
import { type PaymentMethodStatusExtended } from './interface';

export type BillingAddress = {
    CountryCode: string;
    State?: string | null;
    ZipCode?: string | null;
};

export type BillingAddressProperty = {
    BillingAddress: BillingAddress;
};

const DEFAULT_TAX_COUNTRY_CODE = 'CH';
export const DEFAULT_TAX_BILLING_ADDRESS: BillingAddress = {
    CountryCode: DEFAULT_TAX_COUNTRY_CODE,
    State: null,
    ZipCode: null,
};

export type BillingAddressStatus =
    | {
          valid: true;
          reason: undefined;
      }
    | {
          valid: false;
          reason: 'missingCountry' | 'missingState' | 'missingZipCode' | 'invalidZipCode';
      };

export const BILLING_ADDRESS_VALID = Object.freeze({ valid: true, reason: undefined }) satisfies BillingAddressStatus;

export function getBillingAddressStatus(billingAddress: BillingAddress, zipCodeValid = true): BillingAddressStatus {
    if (!zipCodeValid) {
        return { valid: false, reason: 'invalidZipCode' };
    }

    if (!billingAddress.CountryCode) {
        return { valid: false, reason: 'missingCountry' };
    }

    const isCountryWithState = isCountryWithStates(billingAddress.CountryCode);
    if (!isCountryWithState) {
        return BILLING_ADDRESS_VALID;
    }

    if (!billingAddress.State) {
        return { valid: false, reason: 'missingState' };
    }

    if (isCountryWithRequiredPostalCode(billingAddress.CountryCode)) {
        if (!billingAddress.ZipCode) {
            return { valid: false, reason: 'missingZipCode' };
        }

        if (!isPostalCodeValid(billingAddress.CountryCode, billingAddress.State, billingAddress.ZipCode)) {
            return { valid: false, reason: 'invalidZipCode' };
        }
    }

    return BILLING_ADDRESS_VALID;
}

export function billingCountryValidator(billingAddress: BillingAddress) {
    const billingAddressStatus = getBillingAddressStatus(billingAddress);
    if (!billingAddressStatus.valid && billingAddressStatus.reason === 'missingCountry') {
        return c('Error').t`Please select a country`;
    }

    return '';
}

export function billingStateValidator(billingAddress: BillingAddress) {
    const billingAddressStatus = getBillingAddressStatus(billingAddress);
    if (!billingAddressStatus.valid && billingAddressStatus.reason === 'missingState') {
        return c('Error').t`Please select a state`;
    }

    return '';
}

export type FullBillingAddress = {
    CountryCode: string;
    State: string | null;
    Company: string | null;
    Address: string | null;
    ZipCode: string | null;
    City: string | null;
    FirstName: string | null;
    LastName: string | null;
    VatId: string | null;
};

export function paymentStatusToBillingAddress(status: PaymentMethodStatusExtended): BillingAddress {
    return {
        CountryCode: status.CountryCode,
        State: status.State,
        ZipCode: status.ZipCode,
    };
}

/**
 * Implements a set of fallbacks in case the backend doesn't return the complete billing address.
 */
export function getBillingAddressFromPaymentsStatus(billingAddress: BillingAddress): BillingAddress {
    const normalized = { ...billingAddress };

    if (!normalized.CountryCode) {
        normalized.CountryCode = DEFAULT_TAX_BILLING_ADDRESS.CountryCode;
        normalized.State = DEFAULT_TAX_BILLING_ADDRESS.State;
        normalized.ZipCode = DEFAULT_TAX_BILLING_ADDRESS.ZipCode;
    }

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

    if (isCountryWithStates(normalized.CountryCode) && normalized.State && !normalized.ZipCode) {
        normalized.ZipCode = getDefaultPostalCodeByStateCode(normalized.CountryCode, normalized.State);
    }

    return normalized;
}

/**
 * Use it before sending the billing address to the backend. Either /check endpoint or /subscription endpoint.
 */
export function normalizeBillingAddress(billingAddress: BillingAddress, hasZipCodeValidation: boolean): BillingAddress {
    if (!billingAddress.ZipCode) {
        return billingAddress;
    }
    // If the feature flag is off, delete the ZipCode completely to revert to the pre-zip code feature behavior
    if (!hasZipCodeValidation) {
        const copy = {
            ...billingAddress,
        };
        delete copy.ZipCode;
        return copy;
    }
    return {
        ...billingAddress,
        ZipCode: normalizePostalCode(billingAddress.ZipCode, billingAddress.CountryCode),
    };
}
