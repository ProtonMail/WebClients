import { type ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import Label from '@proton/components/components/label/Label';
import clsx from '@proton/utils/clsx';

import { isCountryWithRequiredPostalCode, isCountryWithStates } from '../../../core/countries';
import type { TaxCountryHook } from '../../hooks/useTaxCountry';
import { CountriesDropdown, type CountriesHookProps } from '../CountriesDropdown';
import { InputWithSelectorPrefix, WarningIcon } from '../InputWithSelectorPrefix';
import { StateSelector } from '../StateSelector';
import { CollapsedTaxCountrySelector } from './CollapsedTaxCountrySelector';

import './InlineTaxCountrySelector.scss';

export type InlineTaxCountrySelectorProps = TaxCountryHook &
    CountriesHookProps & {
        className?: string;
        labelClassName?: string;
        buttonClassName?: string;
        spacingClassName?: string;
        forceExpand?: boolean;
        defaultCollapsed: boolean;
    };

export const InlineTaxCountrySelector = ({
    selectedCountryCode,
    setSelectedCountry,
    setFederalStateCode,
    federalStateCode,
    setZipCode,
    zipCode,
    billingAddressStatus,
    billingAddressErrorMessage,
    zipCodeBackendValid,
    allowedCountries,
    disabledCountries,
    offerUnavailableErrorMessage,
    defaultCollapsed,
    className,
}: InlineTaxCountrySelectorProps) => {
    const showStateCode = isCountryWithStates(selectedCountryCode);
    const showZipCode = isCountryWithRequiredPostalCode(selectedCountryCode);

    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    useEffect(() => {
        if (!collapsed) {
            return;
        }

        setCollapsed(
            // If there is no state selection, then we collapse the component by default
            !!selectedCountryCode &&
                // if there is state selection and state **is** specified, then we **collapse** the component by default
                // If there is state selection and state **is not** specified, then we **expand** the component by default
                (!showStateCode || !!federalStateCode) &&
                // If there is ZIP code selection and zip code **is not** specified, then we **expand** the component by default
                (!showZipCode || !!zipCode) &&
                // If the billing address is invalid, then we **expand** the component by default
                billingAddressStatus.valid
        );
    }, [selectedCountryCode, showStateCode, federalStateCode, showZipCode, zipCode, billingAddressStatus.valid]);

    const [isCountriesDropdownOpen, setIsCountriesDropdownOpen] = useState(false);
    const [isStatesDropdownOpen, setIsStatesDropdownOpen] = useState(false);

    const showBoth = showStateCode && showZipCode;

    const [postalCodeInputDirty, setPostalCodeInputDirty] = useState(false);

    const zipCodeInvalid = // show the error message if the ZIP code was checked on the backend and it's invalid
        // show the error message if the local validation failed - but only if the input is dirty (interacted with).
        !zipCodeBackendValid ||
        (postalCodeInputDirty &&
            (billingAddressStatus.reason === 'missingZipCode' || billingAddressStatus.reason === 'invalidZipCode'));

    const countryInvalid = billingAddressStatus.reason === 'missingCountry';
    const stateInvalid = billingAddressStatus.reason === 'missingState';

    const shouldShowError =
        // hide the error message if user opens a dropdown to change country or state
        !isCountriesDropdownOpen && !isStatesDropdownOpen && (zipCodeInvalid || countryInvalid || stateInvalid);

    const commonZipProps = {
        value: zipCode ?? '',
        onChange: (e: ChangeEvent<HTMLInputElement>) => setZipCode(e.target.value),
        placeholder: selectedCountryCode === 'US' ? c('Placeholder').t`ZIP code` : c('Placeholder').t`Postal code`,
        'data-testid': 'tax-zip-code',
        error: shouldShowError,
        className: 'zip-input region-input-stacked',
        onBlur: () => setPostalCodeInputDirty(true),
    };

    const commonStateProps = {
        onStateChange: setFederalStateCode,
        federalStateCode: federalStateCode,
        selectedCountryCode: selectedCountryCode,
        isOpen: isStatesDropdownOpen,
        onOpen: () => setIsStatesDropdownOpen(true),
        onClose: () => setIsStatesDropdownOpen(false),
    };

    if (offerUnavailableErrorMessage?.hideBillingCountry) {
        return null;
    }

    const shouldStackCountriesField = showBoth || showStateCode || showZipCode;

    return (
        <div className={clsx('field-two-container tax-country-selector', className)}>
            {collapsed && (
                <CollapsedTaxCountrySelector
                    onClick={() => {
                        setCollapsed(false);
                        if (!isCountryWithStates(selectedCountryCode)) {
                            setIsCountriesDropdownOpen(true);
                        }
                    }}
                    federalStateCode={federalStateCode}
                    zipCode={zipCode}
                    selectedCountryCode={selectedCountryCode}
                />
            )}
            {!collapsed && (
                <>
                    <Label className="mb-1 inline-block" htmlFor="tax-country">
                        <span className="text-bold">{c('Payments').t`Billing Country`}</span>
                    </Label>
                    <CountriesDropdown
                        selectedCountryCode={selectedCountryCode}
                        onChange={setSelectedCountry}
                        id="tax-country"
                        isOpen={isCountriesDropdownOpen}
                        onOpen={() => setIsCountriesDropdownOpen(true)}
                        onClose={() => setIsCountriesDropdownOpen(false)}
                        data-testid="tax-country-dropdown"
                        className={clsx('country-selector', shouldStackCountriesField && 'country-selector-stacked')}
                        allowedCountries={allowedCountries}
                        disabledCountries={disabledCountries}
                    />
                    {showStateCode && !showBoth ? (
                        <StateSelector {...commonStateProps} className="mt-1 region-input-stacked" />
                    ) : null}
                    {showZipCode && !showBoth ? <Input {...commonZipProps} /> : null}
                    {showBoth ? (
                        <InputWithSelectorPrefix
                            prefix={<StateSelector {...commonStateProps} unstyled className="zip ml-4 mr-1" />}
                            {...commonZipProps}
                            className={clsx(commonZipProps.className, 'region-input-stacked')}
                            showError={false}
                        />
                    ) : null}
                    {billingAddressErrorMessage && (
                        <div className="error-container mt-1 text-semibold text-sm flex">
                            <WarningIcon className="mr-1" />
                            <span data-testid="billing-country-error">{billingAddressErrorMessage}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
