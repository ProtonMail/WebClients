import { type ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton, Input } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { getStateName, isCountryWithRequiredPostalCode, isCountryWithStates } from '../../core/countries';
import { type TaxCountryHook } from '../hooks/useTaxCountry';
import { CountriesDropdown, useCountries } from './CountriesDropdown';
import { InputWithSelectorPrefix, WarningIcon } from './InputWithSelectorPrefix';
import { StateSelector } from './StateSelector';

import './TaxCountrySelector.scss';

export type TaxCountrySelectorProps = TaxCountryHook & {
    className?: string;
    labelClassName?: string;
    buttonClassName?: string;
    spacingClassName?: string;
    forceExpand?: boolean;
};

export const TaxCountrySelector = ({
    selectedCountryCode,
    setSelectedCountry,
    setFederalStateCode,
    federalStateCode,
    setZipCode,
    zipCode,
    className,
    labelClassName,
    buttonClassName,
    spacingClassName = 'pt-1 mb-1',
    billingAddressStatus,
    billingAddressErrorMessage,
    zipCodeBackendValid,
}: TaxCountrySelectorProps) => {
    const showStateCode = isCountryWithStates(selectedCountryCode);
    const showZipCode = isCountryWithRequiredPostalCode(selectedCountryCode);

    const [collapsed, setCollapsed] = useState(true);

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

    const { getCountryByCode } = useCountries();
    const selectedCountry = getCountryByCode(selectedCountryCode);
    const [isCountriesDropdownOpen, setIsCountriesDropdownOpen] = useState(false);
    const [isStatesDropdownOpen, setIsStatesDropdownOpen] = useState(false);

    const collapsedText = (() => {
        if (selectedCountry?.label) {
            let text = selectedCountry.label;
            if (federalStateCode && showStateCode) {
                text += `, ${getStateName(selectedCountryCode, federalStateCode)}`;
            }

            if (zipCode && showZipCode) {
                text += `, ${zipCode}`;
            }

            return text;
        }

        return c('Action').t`Select country`;
    })();

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
        className: 'zip-input',
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

    return (
        <div className={clsx('field-two-container tax-country-selector', className)}>
            <div className={spacingClassName} data-testid="billing-country">
                <span className="text-bold">{c('Payments').t`Billing Country`}</span>
                {collapsed && (
                    <>
                        <span className={clsx('text-bold mr-2', labelClassName)}>:</span>
                        <InlineLinkButton
                            onClick={() => {
                                setCollapsed(false);
                                if (!isCountryWithStates(selectedCountryCode)) {
                                    setIsCountriesDropdownOpen(true);
                                }
                            }}
                            data-testid="billing-country-collapsed"
                            className={buttonClassName}
                        >
                            {collapsedText}
                        </InlineLinkButton>
                    </>
                )}
            </div>
            {!collapsed && (
                <>
                    <CountriesDropdown
                        selectedCountryCode={selectedCountryCode}
                        onChange={setSelectedCountry}
                        id="tax-country"
                        isOpen={isCountriesDropdownOpen}
                        onOpen={() => setIsCountriesDropdownOpen(true)}
                        onClose={() => setIsCountriesDropdownOpen(false)}
                        data-testid="tax-country-dropdown"
                        className={clsx('country-selector', showBoth && 'country-selector--triplet')}
                    />
                    {showStateCode && !showBoth ? <StateSelector {...commonStateProps} className="mt-1" /> : null}
                    {showZipCode && !showBoth ? <Input {...commonZipProps} /> : null}
                    {showBoth ? (
                        <InputWithSelectorPrefix
                            prefix={<StateSelector {...commonStateProps} unstyled className="zip ml-4 mr-1" />}
                            {...commonZipProps}
                            className={clsx(commonZipProps.className, showBoth && 'zip-input--triplet')}
                            showError={false}
                        />
                    ) : null}
                    <div className="error-container mt-1 text-semibold text-sm flex">
                        {billingAddressErrorMessage && (
                            <>
                                <WarningIcon className="mr-1" />
                                <span data-testid="billing-country-error">{billingAddressErrorMessage}</span>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TaxCountrySelector;
