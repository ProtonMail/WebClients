import { useMemo, useState } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import type { SearcheableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { type FormFieldValidator } from '@proton/components/components/v2/useFormErrors';
import clsx from '@proton/utils/clsx';

import { type BillingAddress, billingCountryValidator, billingStateValidator } from '../../core/billing-address';
import { getStateList, isCountryWithStates } from '../../core/countries';
import { CountriesDropdown } from './CountriesDropdown';

interface StateSelectorProps {
    onStateChange: (stateCode: string) => void;
    federalStateCode: string | null;
    selectedCountryCode: string;
    id?: string;
    className?: string;
}

const StateSelector = ({ onStateChange, federalStateCode, selectedCountryCode, id, className }: StateSelectorProps) => {
    const states = useMemo(() => getStateList(selectedCountryCode), [selectedCountryCode]);

    const props: SearcheableSelectProps<string> = {
        id,
        className,
        onChange: ({ value: stateCode }: SelectChangeEvent<string>) => onStateChange?.(stateCode),
        value: federalStateCode ?? '',
        placeholder: c('Placeholder').t`Select state`,
        children: states.map(({ stateName, stateCode }) => {
            return (
                <Option key={stateCode} value={stateCode} title={stateName} data-testid={`state-${stateCode}`}>
                    {stateName}
                </Option>
            );
        }),
    };

    return <SearchableSelect {...props} data-testid="tax-state-dropdown" />;
};

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
