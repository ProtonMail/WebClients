import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { InputFieldTwo, SearchableSelect } from '@proton/components/components';
import type { CountryOption } from '@proton/components/components/country/helpers';
import {
    PRESELECTED_COUNTRY_OPTION_SUFFIX,
    getAllDropdownOptions,
    getCleanCountryCode,
    getIsCountryOption,
    isPreselectedOption,
    optionToPreselectedOption,
} from '@proton/components/components/country/helpers';
import type { OptionProps } from '@proton/components/components/option/Option';
import Option from '@proton/components/components/option/Option';
import type { Props as SearchableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import { getFlagSvg } from '@proton/components/components/v2/phone/flagSvgs';
import generateUID from '@proton/utils/generateUID';

import { defaultFilterFunction } from '../selectTwo/helpers';

/**
 * Filter options based on the search string and their option disabled state.
 * If an option is disabled, it's a divider, and we don't want to display it
 */
const countryFilterFunction = (option: OptionProps<string>, keyword?: string) =>
    keyword &&
    defaultFilterFunction(option, keyword) &&
    !option.disabled &&
    !option.value.endsWith(PRESELECTED_COUNTRY_OPTION_SUFFIX);

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
    error?: string;
    hint?: string;
    disabled?: boolean;

    /**
     * Custom searchable select
     */
    as?: (props: SearchableSelectProps<string>) => JSX.Element;
    /**
     * Whether selector should have a label or not
     */
    label?: ReactNode | null;
    assistContainerClassName?: string;
}

const CountrySelect = ({
    options,
    preSelectedOptionDivider,
    preSelectedOption,
    value,
    onSelectCountry,
    error,
    hint,
    disabled,
    label = c('Label').t`Country`,
    assistContainerClassName,
    as = SearchableSelect<string>,
}: Props) => {
    const [selectedCountryOption, setSelectedCountryOption] = useState<CountryOption | undefined>(
        value || (preSelectedOption ? optionToPreselectedOption(preSelectedOption) : undefined)
    );

    const { dropdownOptions, countryOptions } = useMemo(() => {
        const dropdownOptions = getAllDropdownOptions(options, preSelectedOption, preSelectedOptionDivider);
        const countryOptions = dropdownOptions.filter(getIsCountryOption);

        return { dropdownOptions, countryOptions };
    }, [options, preSelectedOption, preSelectedOptionDivider]);

    const handleSelectOption = useCallback(
        ({ value }: { value: string }) => {
            const selectedOption = countryOptions.find(({ countryCode }) => countryCode === value);
            setSelectedCountryOption(selectedOption);
            onSelectCountry?.(getCleanCountryCode(value));
        },
        [countryOptions, onSelectCountry]
    );

    const optionsComponents = useMemo(
        () =>
            dropdownOptions.map((option) => {
                if (option.type === 'country') {
                    return (
                        <Option
                            key={generateUID(option.countryName)}
                            value={option.countryCode}
                            title={option.countryName}
                            data-testid={
                                isPreselectedOption(option.countryCode)
                                    ? 'preselected-country-select-option'
                                    : 'country-select-option'
                            }
                        >
                            <span>
                                <img
                                    className="shrink-0 mr-2"
                                    alt=""
                                    src={getFlagSvg(getCleanCountryCode(option.countryCode))}
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
                            <span className="text-sm">{option.text}</span>
                        </Option>
                    );
                }
            }),
        [dropdownOptions]
    );

    return (
        <InputFieldTwo
            id="countrySelect"
            as={as}
            placeholder={c('Placeholder').t`Please select a country`}
            label={label}
            value={selectedCountryOption?.countryCode}
            onChange={handleSelectOption}
            search={countryFilterFunction}
            error={error}
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
            disabled={disabled}
            assistContainerClassName={assistContainerClassName}
        >
            {optionsComponents}
        </InputFieldTwo>
    );
};

export default CountrySelect;
