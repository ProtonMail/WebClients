import { c } from 'ttag';

import { countriesWithStates } from './countries';

export type BillingAddress = {
    CountryCode: string;
    State?: string | null;
};

export type BillingAddressProperty = {
    BillingAddress: BillingAddress;
};

const DEFAULT_TAX_COUNTRY_CODE = 'CH';
export const DEFAULT_TAX_BILLING_ADDRESS: BillingAddress = {
    CountryCode: DEFAULT_TAX_COUNTRY_CODE,
    State: null,
};

export type BillingAddressStatus =
    | {
          valid: true;
          reason: undefined;
      }
    | {
          valid: false;
          reason: 'missingCountry' | 'missingState';
      };

export const BILLING_ADDRESS_VALID = Object.freeze({ valid: true, reason: undefined }) satisfies BillingAddressStatus;

export function getBillingAddressStatus(billingAddress: BillingAddress): BillingAddressStatus {
    if (!billingAddress.CountryCode) {
        return { valid: false, reason: 'missingCountry' };
    }

    const isCountryWithState = countriesWithStates.includes(billingAddress.CountryCode);
    if (!isCountryWithState) {
        return BILLING_ADDRESS_VALID;
    }

    if (!billingAddress.State) {
        return { valid: false, reason: 'missingState' };
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
    State?: string | null;
    Company?: string;
    Address?: string;
    ZipCode?: string;
    City?: string;
    FirstName?: string;
    LastName?: string;
    VatId?: string;
};

export function isFullBillingAddress(obj: any): obj is FullBillingAddress {
    if (!obj || !obj.CountryCode) {
        return false;
    }

    if (countriesWithStates.includes(obj.CountryCode)) {
        return !!obj.State;
    }

    return true;
}
