import { useState } from 'react';

import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { type FormFieldValidator } from '@proton/components/components/v2/useFormErrors';
import clsx from '@proton/utils/clsx';

import {
    type BillingAddress,
    billingCountryValidator,
    billingStateValidator,
} from '../../core/billing-address/billing-address';
import { isCountryWithStates } from '../../core/countries';
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

    const countriesDropdown = (
        <CountriesDropdown
            id={billingCountryId}
            selectedCountryCode={selectedCountryCode}
            onChange={setSelectedCountry}
            isOpen={isDropdownOpen}
            onOpen={() => setIsDropdownOpen(true)}
            onClose={() => setIsDropdownOpen(false)}
            data-testid="tax-country-dropdown"
        />
    );

    const stateDropdown = (
        <StateSelector
            id="billing-state"
            onStateChange={setFederalState}
            federalStateCode={federalStateCode}
            selectedCountryCode={selectedCountryCode}
            className={clsx(!fullsize && 'mt-1')}
        />
    );

    if (fullsize) {
        return (
            <>
                <InputFieldTwo
                    label={c('Label').t`Country`}
                    as={() => countriesDropdown}
                    error={validator?.([billingCountryValidator(billingAddress)])}
                />
                {showStateCode ? (
                    <InputFieldTwo
                        label={c('Label').t`State`}
                        as={() => stateDropdown}
                        error={validator?.([billingStateValidator(billingAddress)])}
                    />
                ) : null}
            </>
        );
    }

    return (
        <>
            {countriesDropdown}
            {showStateCode ? stateDropdown : null}
        </>
    );
};
