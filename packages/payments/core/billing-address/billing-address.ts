import { c } from 'ttag';

import { normalizePostalCode } from '../../postal-codes/format';
import { isPostalCodeValid } from '../../postal-codes/postal-codes-validation';
import { isCountryWithRequiredPostalCode, isCountryWithStates } from '../countries';

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
