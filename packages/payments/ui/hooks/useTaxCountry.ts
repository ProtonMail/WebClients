import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { type PaymentFacade } from '@proton/components/payments/client-extensions';
import { useFlag } from '@proton/unleash';

import {
    type BillingAddress,
    type BillingAddressStatus,
    DEFAULT_TAX_BILLING_ADDRESS,
    getBillingAddressStatus,
} from '../../core/billing-address';
import { getDefaultState, isCountryWithStates } from '../../core/countries';
import { type PaymentMethodStatusExtended } from '../../core/interface';
import { getDefaultPostalCodeByStateCode } from '../../postal-codes/default-postal-codes';
import { isPostalCodeValid } from '../../postal-codes/postal-codes-validation';

export type OnBillingAddressChange = (billingAddress: BillingAddress) => void;

interface HookProps {
    onBillingAddressChange?: OnBillingAddressChange;
    statusExtended?: Pick<PaymentMethodStatusExtended, 'CountryCode' | 'State' | 'ZipCode'>;
    zipCodeBackendValid: boolean;
    paymentFacade?: PaymentFacade;
    previosValidZipCode?: string | null;
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
}

export const useTaxCountry = (props: HookProps): TaxCountryHook => {
    const zipCodeValidation = useFlag('PaymentsZipCodeValidation');

    const initialBillingAddress: BillingAddress = props.statusExtended
        ? ({
              CountryCode: props.statusExtended.CountryCode,
              State: props.statusExtended.State,
              ZipCode: zipCodeValidation ? props.statusExtended.ZipCode : null,
          } satisfies BillingAddress)
        : DEFAULT_TAX_BILLING_ADDRESS;

    const taxBillingAddressRef = useRef<BillingAddress>(initialBillingAddress);
    const [, forceRender] = useState(0);
    // Helper function to trigger re-render
    const triggerRerender = () => forceRender((prev) => prev + 1);
    const setTaxBillingAddress = (billingAddress: BillingAddress) => {
        taxBillingAddressRef.current = billingAddress;
        triggerRerender();
    };

    const billingAddressChanged = (billingAddress: BillingAddress) => {
        if (!zipCodeValidation) {
            const billingAddressWithoutZipCode = { ...billingAddress };
            delete billingAddressWithoutZipCode.ZipCode;

            props.onBillingAddressChange?.(billingAddressWithoutZipCode);
            return;
        }

        props.onBillingAddressChange?.(billingAddress);
    };

    useEffect(() => {
        if (taxBillingAddressRef.current.CountryCode) {
            props.paymentFacade?.chargebeeCard.setCountryCode(taxBillingAddressRef.current.CountryCode);
        }

        if (taxBillingAddressRef.current.ZipCode) {
            props.paymentFacade?.chargebeeCard.setPostalCode(taxBillingAddressRef.current.ZipCode);
        }
    }, [taxBillingAddressRef.current.CountryCode, taxBillingAddressRef.current.ZipCode]);

    useEffect(() => {
        const currentFromProps: BillingAddress = props.statusExtended
            ? ({
                  CountryCode: props.statusExtended.CountryCode,
                  State: props.statusExtended.State,
                  ZipCode: zipCodeValidation ? props.statusExtended.ZipCode : null,
              } satisfies BillingAddress)
            : DEFAULT_TAX_BILLING_ADDRESS;

        // Compare with current ref value to avoid unnecessary updates
        const current = taxBillingAddressRef.current;
        const hasChanged =
            current.CountryCode !== currentFromProps.CountryCode ||
            current.State !== currentFromProps.State ||
            current.ZipCode !== currentFromProps.ZipCode;

        if (hasChanged) {
            setTaxBillingAddress(currentFromProps);
            billingAddressChanged(currentFromProps);
        }
    }, [
        props.statusExtended?.CountryCode,
        props.statusExtended?.State,
        props.statusExtended?.ZipCode,
        zipCodeValidation,
    ]);

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
            isCountryWithStates(newCountryCode) && State
                ? getDefaultPostalCodeByStateCode(newCountryCode, State)
                : null;

        const newValue: BillingAddress = {
            ...current,
            CountryCode: newCountryCode,
            State,
            ZipCode,
        };

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
            ZipCode: isCountryWithStates(current.CountryCode)
                ? getDefaultPostalCodeByStateCode(current.CountryCode, newFederalStateCode)
                : null,
        };

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
        if (
            newValue.State &&
            isPostalCodeValid(newValue.CountryCode, newValue.State, newZipCode) &&
            !skipCallback &&
            zipCodeValidation
        ) {
            billingAddressChanged(newValue);
        }
    };

    const billingAddressStatus = getBillingAddressStatus(taxBillingAddressRef.current, props.zipCodeBackendValid);
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
    }, [billingAddressStatus.reason, props.zipCodeBackendValid]);

    const prevZipCodeValidRef = useRef<boolean | undefined>(undefined);
    useEffect(
        /**
         * If the ZIP code in the taxCountry hook is different then we need to override it after we has a
         * successfull check. Example: User has US, CA, 90001 - valid ZIP code. User selects US, CA, 90000. This
         * ZIP code does not exist, and the backend returns an error. zipCodeValid is marked as false. We do not
         * store invalid zip codes in the state, so the state remains US, CA, 90001. Then user changes e.g.
         * currency. At this point, the frontend will do another check with the new currency and
         * 90001. This check returns 200, and now we need to override the ZIP code in the taxCountry hook,
         * otherwise it will keep displaying 90000.
         */
        function overrideZipCodeWhenItsValidAgain() {
            const prevZipCodeValid = prevZipCodeValidRef.current;
            const currentZipCodeValid = props.zipCodeBackendValid;

            if (props.previosValidZipCode && currentZipCodeValid && prevZipCodeValid === false) {
                setZipCode(props.previosValidZipCode, { skipCallback: true });
            }

            prevZipCodeValidRef.current = currentZipCodeValid;
        },
        [props.previosValidZipCode, props.zipCodeBackendValid]
    );

    return {
        selectedCountryCode,
        setSelectedCountry,
        federalStateCode,
        setFederalStateCode,
        zipCode,
        setZipCode,
        billingAddressValid: billingAddressStatus.valid && props.zipCodeBackendValid,
        billingAddressStatus,
        billingAddressErrorMessage,
        zipCodeBackendValid: props.zipCodeBackendValid,
    };
};
