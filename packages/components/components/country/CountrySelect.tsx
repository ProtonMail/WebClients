import { useMemo, useState } from 'react';

import { c } from 'ttag';

import generateUID from '@proton/atoms/generateUID';
import { InputFieldTwo, Option, SearchableSelect } from '@proton/components/components';
import { CountryOption, getCountryDropdownOptions } from '@proton/components/components/country/helpers';
import { Props as OptionProps } from '@proton/components/components/option/Option';
import { getFlagSvg } from '@proton/components/components/v2/phone/flagSvgs';

import { arrayIncludesString, includesString } from '../selectTwo/helpers';

/**
 * Filter options based on the search string and their option disabled state.
 * If an option is disabled, it's a divider, and we don't want to display it
 */
const countryFilterFunction = <V,>(option: OptionProps<V>, keyword?: string) =>
    keyword &&
    ((option.title && includesString(option.title, keyword)) ||
        (option.searchStrings && arrayIncludesString(option.searchStrings, keyword))) &&
    !option.disabled;

interface Props {
    /**
     * Country options to list in the dropdown
     */
    options: CountryOption[];
    /**
     * Pre-selected country option (or suggestion) that will be displayed at the top of the dropdown
     */
    preSelectedOption?: CountryOption;
    /**
     * Pre-selected country option divider text
     * Default one is "Based on your time zone"
     */
    preSelectedOptionDivider?: string;
    /**
     * Default select value
     */
    value?: CountryOption;
    onSelectCountry?: (value: string) => void;
    validator?: (validations: string[]) => string;
    errorText?: string;
    error?: boolean;
    hint?: string;
}

const CountrySelect = ({
    options,
    preSelectedOptionDivider,
    preSelectedOption,
    value,
    onSelectCountry,
    validator,
    errorText,
    error,
    hint,
}: Props) => {
    const [selectedCountry, setSelectedCountry] = useState<CountryOption | undefined>(value || preSelectedOption);

    const handleSelectCountry = ({ value }: { value: any }) => {
        const selectedOption = options.find(({ countryCode }) => countryCode === value);
        setSelectedCountry(selectedOption);

        onSelectCountry?.(value);
    };

    const dropdownOptions = useMemo(() => {
        return getCountryDropdownOptions(options, preSelectedOption, preSelectedOptionDivider);
    }, [options, preSelectedOption, preSelectedOptionDivider]);

    const getErrorText = () => {
        const hasError = selectedCountry === undefined || error;

        if (errorText && hasError) {
            return errorText;
        }

        return '';
    };

    const getError = () => {
        if (error && errorText) {
            return errorText;
        }

        return validator ? validator([getErrorText()]) : undefined;
    };

    return (
        <InputFieldTwo
            id="countrySelect"
            as={SearchableSelect}
            placeholder={c('Placeholder').t`Please select a country`}
            label={c('Label').t`Country`}
            value={selectedCountry?.countryCode}
            onChange={handleSelectCountry}
            search={countryFilterFunction}
            uniqueSearchResult
            error={getError()}
            aria-describedby="countrySelect"
            noSearchResults={
                <>
                    <span className="text-bold">{c('Select search results').t`No results found`}</span>
                    <br />
                    <span className="text-sm">{c('Select search results')
                        .t`Check your spelling or select a country from the list.`}</span>
                </>
            }
            hint={hint}
            data-testid="country-select"
        >
            {dropdownOptions.map((option) => {
                if (option.type === 'country') {
                    return (
                        <Option
                            key={generateUID(option.countryName)}
                            value={option.countryCode}
                            title={option.countryName}
                        >
                            <span>
                                <img
                                    className="flex-item-noshrink mr0-5"
                                    alt=""
                                    src={getFlagSvg(option.countryCode)}
                                    width="30"
                                    height="20"
                                />
                                <span>{option.countryName}</span>
                            </span>
                        </Option>
                    );
                } else {
                    return (
                        <Option key={generateUID('divider')} value={option.text} title={option.text} disabled>
                            <span>{option.text}</span>
                        </Option>
                    );
                }
            })}
        </InputFieldTwo>
    );
};

export default CountrySelect;
