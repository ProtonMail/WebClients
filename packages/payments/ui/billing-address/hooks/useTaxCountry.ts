import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';

import {
    type BillingAddress,
    type BillingAddressExtended,
    type BillingAddressStatus,
    DEFAULT_TAX_BILLING_ADDRESS,
    getBillingAddressStatus,
} from '../../../core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '../../../core/billing-address/billing-address-from-payments-status';
import { getDefaultState, isCountryWithRequiredPostalCode, isCountryWithStates } from '../../../core/countries';
import {
    type BillingAddressValidationResult,
    getWrongBillingAddressValidationResult,
    hasInvalidZipCodeError,
} from '../../../core/errors';
import type { PaymentsApi } from '../../../core/interface';
import { getDefaultPostalCodeByStateCode } from '../../../postal-codes/default-postal-codes';
import { isPostalCodeValid } from '../../../postal-codes/postal-codes-validation';
import type { PaymentTelemetryContext } from '../../../telemetry/helpers';
import { checkoutTelemetry } from '../../../telemetry/telemetry';
import { type CountryItem, getFullList } from '../../helpers/countries-sorted';

export type OnBillingAddressChange = (billingAddress: BillingAddress) => void;

interface HookProps {
    onBillingAddressChange?: OnBillingAddressChange;
    initialBillingAddress?: BillingAddressExtended;
    paymentFacade?: PaymentFacade;
    telemetryContext: PaymentTelemetryContext;
    allowedCountries?: string[];
    disabledCountries?: string[];
    paymentsApi?: PaymentsApi;
}

export interface TaxCountryHook {
    selectedCountryCode: string;
    setSelectedCountry: (countryCode: string) => void;
    federalStateCode: string | null;
    setFederalStateCode: (federalStateCode: string) => void;
    zipCode: string | null;
    setZipCode: (zipCode: string, options?: { skipCallback?: boolean }) => void;
    billingAddressValid: boolean;
    billingAddressStatus: BillingAddressStatus;
    billingAddressErrorMessage?: string;
    zipCodeBackendValid: boolean;
    allowedCountries?: string[];
    disabledCountries?: string[];
    paymentsApi: PaymentsApi;
    billingAddressChangedInModal: (billingAddress: BillingAddress) => void;
    billingAddressValidationResult?: BillingAddressValidationResult;
}

function getBillingAddressFromProp(props: HookProps): BillingAddress {
    const billingAddress = props.initialBillingAddress
        ? ({
              CountryCode: props.initialBillingAddress.CountryCode,
              State: props.initialBillingAddress.State,
              ZipCode: props.initialBillingAddress.ZipCode,
          } satisfies BillingAddress)
        : DEFAULT_TAX_BILLING_ADDRESS;

    const { allowedCountries, disabledCountries } = props;
    if (allowedCountries && !allowedCountries.includes(billingAddress.CountryCode)) {
        const allowedCountry = allowedCountries[0];
        return getBillingAddressFromPaymentStatus({
            CountryCode: allowedCountry,
            State: null,
            ZipCode: null,
        } satisfies BillingAddress);
    }

    if (disabledCountries?.includes(billingAddress.CountryCode)) {
        const allowedCountry = getFullList().find((country: CountryItem) => !disabledCountries.includes(country.value));

        if (allowedCountry) {
            return getBillingAddressFromPaymentStatus({
                CountryCode: allowedCountry.value,
                State: null,
                ZipCode: null,
            } satisfies BillingAddress);
        } else {
            // Technically, this should be an impossible branch. It can happen only if literally all countries are in
            // the list of disabled countries.
            return DEFAULT_TAX_BILLING_ADDRESS;
        }
    }

    return billingAddress;
}

function isSameBillingAddress(billingAddress1: BillingAddress, billingAddress2: BillingAddress) {
    return (
        billingAddress1.CountryCode === billingAddress2.CountryCode &&
        billingAddress1.State === billingAddress2.State &&
        billingAddress1.ZipCode === billingAddress2.ZipCode
    );
}

export const useTaxCountry = (props: HookProps): TaxCountryHook => {
    const zipCodeBackendValid = !hasInvalidZipCodeError(props.paymentFacade?.checkResult);
    const billingAddressValidationResult = getWrongBillingAddressValidationResult(props.paymentFacade?.checkResult);

    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const paymentsApi = props.paymentsApi ?? defaultPaymentsApi;

    const currentFromPaymentStatus: BillingAddress = getBillingAddressFromProp(props);

    const taxBillingAddressRef = useRef<BillingAddress>(currentFromPaymentStatus);
    const [, forceRender] = useState(0);
    // Helper function to trigger re-render
    const triggerRerender = () => forceRender((prev) => prev + 1);
    const setTaxBillingAddress = (billingAddress: BillingAddress) => {
        taxBillingAddressRef.current = billingAddress;
        triggerRerender();
    };

    const billingAddressChanged = (billingAddress: BillingAddress) => {
        props.onBillingAddressChange?.(billingAddress);
    };

    useEffect(() => {
        if (taxBillingAddressRef.current.CountryCode) {
            props.paymentFacade?.chargebeeCard?.setCountryCode(taxBillingAddressRef.current.CountryCode);
        }

        if (taxBillingAddressRef.current.ZipCode) {
            props.paymentFacade?.chargebeeCard?.setPostalCode(taxBillingAddressRef.current.ZipCode);
        }
    }, [taxBillingAddressRef.current.CountryCode, taxBillingAddressRef.current.ZipCode]);

    useEffect(() => {
        const current = taxBillingAddressRef.current;

        // During page loading, we initially use the default billing address (CH). When payment status is loaded, we
        // update the billing address. It can lead to the situation where the useTaxCountry hook still stores CH, so we
        // need to update the local state.
        const localStateStale = !isSameBillingAddress(current, currentFromPaymentStatus);

        if (localStateStale) {
            setTaxBillingAddress(currentFromPaymentStatus);

            const checkResultBillingAddress = props.paymentFacade?.checkResult?.requestData?.BillingAddress;
            // Sometimes we need to trigger change in the outer state too, in case if the parent component still doesn't
            // have subscription estimation for the correct billing address.
            const outerStateStale =
                !checkResultBillingAddress ||
                !isSameBillingAddress(checkResultBillingAddress, currentFromPaymentStatus);
            if (outerStateStale) {
                billingAddressChanged(currentFromPaymentStatus);
            }
        }
    }, [currentFromPaymentStatus.CountryCode, currentFromPaymentStatus.State, currentFromPaymentStatus.ZipCode]);

    const selectedCountryCode = taxBillingAddressRef.current.CountryCode;
    const federalStateCode = taxBillingAddressRef.current.State ?? null;
    const zipCode = taxBillingAddressRef.current.ZipCode ?? null;
    const setSelectedCountry = (newCountryCode: string) => {
        const current = taxBillingAddressRef.current;
        if (current.CountryCode === newCountryCode) {
            return;
        }

        const State = isCountryWithStates(newCountryCode) ? getDefaultState(newCountryCode) : null;
        const ZipCode =
            isCountryWithRequiredPostalCode(newCountryCode) && State
                ? getDefaultPostalCodeByStateCode(newCountryCode, State)
                : null;

        const newValue: BillingAddress = {
            ...current,
            CountryCode: newCountryCode,
            State,
            ZipCode,
        };

        checkoutTelemetry.reportBillingCountryChange({
            action: 'change_country',
            context: props.telemetryContext,
            currentCountry: current.CountryCode,
            selectedCountry: newCountryCode,
            currentState: current.State ?? null,
            selectedState: State,
        });

        setTaxBillingAddress(newValue);
        billingAddressChanged(newValue);
    };

    const setFederalStateCode = (newFederalStateCode: string) => {
        const current = taxBillingAddressRef.current;
        if (current.State === newFederalStateCode) {
            return;
        }

        const newValue: BillingAddress = {
            ...current,
            State: newFederalStateCode,
            ZipCode: isCountryWithRequiredPostalCode(current.CountryCode)
                ? getDefaultPostalCodeByStateCode(current.CountryCode, newFederalStateCode)
                : null,
        };

        checkoutTelemetry.reportBillingCountryChange({
            action: 'change_state',
            context: props.telemetryContext,
            currentCountry: current.CountryCode,
            selectedCountry: current.CountryCode,
            currentState: current.State ?? null,
            selectedState: newFederalStateCode,
        });

        setTaxBillingAddress(newValue);
        billingAddressChanged(newValue);
    };

    const setZipCode: TaxCountryHook['setZipCode'] = (
        newZipCode: string,
        { skipCallback } = { skipCallback: false }
    ) => {
        const current = taxBillingAddressRef.current;
        if (current.ZipCode === newZipCode) {
            return;
        }

        const newValue: BillingAddress = {
            ...current,
            ZipCode: newZipCode,
        };

        setTaxBillingAddress(newValue);
        if (newValue.State && isPostalCodeValid(newValue.CountryCode, newValue.State, newZipCode) && !skipCallback) {
            billingAddressChanged(newValue);
        }
    };

    const billingAddressStatus = getBillingAddressStatus(taxBillingAddressRef.current, zipCodeBackendValid);
    const billingAddressErrorMessage = useMemo(() => {
        if (billingAddressStatus.reason === 'missingCountry') {
            return c('Error').t`Please select billing country`;
        }

        if (billingAddressStatus.reason === 'missingState') {
            // translator: "state" as in "United States of America"
            return c('Error').t`Please select billing state`;
        }

        if (billingAddressStatus.reason === 'missingZipCode') {
            if (selectedCountryCode === 'US') {
                return c('Error').t`Please enter ZIP code`;
            }
            return c('Error').t`Please enter postal code`;
        }

        if (billingAddressStatus.reason === 'invalidZipCode') {
            if (selectedCountryCode === 'US') {
                return c('Error').t`Please enter a valid ZIP code`;
            }
            return c('Error').t`Please enter a valid postal code`;
        }
    }, [billingAddressStatus.reason, zipCodeBackendValid]);

    const billingAddressChangedInModal = (billingAddress: BillingAddress) => {
        setTaxBillingAddress(billingAddress);
        billingAddressChanged(billingAddress);
    };

    return {
        selectedCountryCode,
        setSelectedCountry,
        federalStateCode,
        setFederalStateCode,
        zipCode,
        setZipCode,
        billingAddressValid: billingAddressStatus.valid && zipCodeBackendValid,
        billingAddressStatus,
        billingAddressErrorMessage,
        zipCodeBackendValid,
        allowedCountries: props.allowedCountries,
        disabledCountries: props.disabledCountries,
        paymentsApi,
        billingAddressChangedInModal,
        billingAddressValidationResult,
    };
};
