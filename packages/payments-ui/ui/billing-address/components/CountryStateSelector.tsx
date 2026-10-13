import { useState } from 'react';

import { c } from 'ttag';

import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import type { FormFieldValidator } from '@proton/components/components/v2/useFormErrors';
import {
    type BillingAddress,
    billingCountryValidator,
    billingStateValidator,
} from '@proton/payments/core/billing-address/billing-address';
import { isCountryWithStates } from '@proton/payments/core/countries';
import clsx from '@proton/utils/clsx';

import { CountriesDropdown } from './CountriesDropdown';
import { StateSelector } from './StateSelector';

interface CountryStateSelectorProps {
    selectedCountryCode: string;
    setSelectedCountry: (countryCode: string) => void;
    federalStateCode: string | null;
    setFederalState: (stateCode: string) => void;
    billingCountryId?: string;
    isDropdownOpen?: boolean;
    fullsize?: boolean;
    validator?: FormFieldValidator;
}

export const CountryStateSelector = ({
    selectedCountryCode,
    setSelectedCountry,
    federalStateCode,
    setFederalState,
    billingCountryId = 'billing-country',
    isDropdownOpen: isDropdownOpenProp,
    fullsize = false,
    validator,
}: CountryStateSelectorProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(!!isDropdownOpenProp);
    const showStateCode = isCountryWithStates(selectedCountryCode);

    const billingAddress: BillingAddress = { CountryCode: selectedCountryCode, State: federalStateCode };

    const countriesDropdownProps = {
        id: billingCountryId,
        selectedCountryCode,
        onChange: setSelectedCountry,
        isOpen: isDropdownOpen,
        onOpen: () => setIsDropdownOpen(true),
        onClose: () => setIsDropdownOpen(false),
        'data-testid': 'tax-country-dropdown',
    };

    const stateDropdownProps = {
        id: 'billing-state',
        onStateChange: setFederalState,
        federalStateCode,
        selectedCountryCode,
        className: clsx(!fullsize && 'mt-1'),
    };

    if (fullsize) {
        return (
            <>
                <InputFieldTwo
                    as={CountriesDropdown}
                    {...countriesDropdownProps}
                    label={c('Label').t`Country`}
                    error={validator?.([billingCountryValidator(billingAddress)])}
                />
                {showStateCode ? (
                    <InputFieldTwo
                        as={StateSelector}
                        {...stateDropdownProps}
                        label={c('Label').t`State`}
                        error={validator?.([billingStateValidator(billingAddress)])}
                    />
                ) : null}
            </>
        );
    }

    return (
        <>
            <CountriesDropdown {...countriesDropdownProps} />
            {showStateCode ? <StateSelector {...stateDropdownProps} /> : null}
        </>
    );
};
