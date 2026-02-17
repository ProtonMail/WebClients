import { useMemo, useState } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import type { SearcheableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import { defaultFilterFunction } from '@proton/components/components/selectTwo/helpers';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { CountryFlagAndName } from '@proton/components/containers/vpn/gateways/CountryFlagAndName';

import { type CountryItem, DEFAULT_COUNTRIES_SEPARATOR, getFullList } from '../helpers/countries-sorted';

export type CountriesHookProps = {
    // List of countries that will be shown in the dropdown. It takes precedence over disabledCountries.
    allowedCountries?: string[];
    // List of countries that will be disabled in the dropdown.
    disabledCountries?: string[];
};

export const useCountries = ({ allowedCountries, disabledCountries }: CountriesHookProps = {}) => {
    const countries = useMemo(() => {
        const fullList = getFullList();

        if (disabledCountries) {
            return fullList.filter((country) => !disabledCountries.includes(country.value));
        }

        if (allowedCountries) {
            return fullList.filter((country) => allowedCountries.includes(country.value));
        }

        return fullList;
    }, [allowedCountries, disabledCountries]);

    const defaultCountry = allowedCountries?.[0] ?? countries[0];

    const [country, innerSetCountry] = useState(defaultCountry);

    const getCountryByValue = (value: string) => countries.find((country) => country.value === value) ?? defaultCountry;

    const setCountry = (value: string) => {
        if (value === DEFAULT_COUNTRIES_SEPARATOR.value) {
            return;
        }

        innerSetCountry(getCountryByValue(value));
    };

    const getCountryByCode = (countryCode: string) => countries.find((country) => country.value === countryCode);

    return { countries, country, setCountry, getCountryByCode };
};

const getCountriesDropdownLabel = (countryItem: CountryItem) => {
    const { value, label } = countryItem;

    if (value === DEFAULT_COUNTRIES_SEPARATOR.value) {
        return <hr className="m-0" />;
    }

    return (
        <span className="flex items-center gap-2">
            <CountryFlagAndName className="ml-0 mr-0" countryCode={value} countryName={label} />
        </span>
    );
};

type Props = {
    onChange?: (countryCode: string) => void;
    selectedCountryCode: string;
    autoComplete?: string;
} & CountriesHookProps &
    Omit<SearcheableSelectProps<CountryItem>, 'children' | 'value' | 'search' | 'onChange'>;

export const CountriesDropdown = ({
    onChange,
    selectedCountryCode,
    allowedCountries,
    disabledCountries,
    ...rest
}: Props) => {
    const { countries, getCountryByCode } = useCountries({ allowedCountries, disabledCountries });
    const selectedCountryItem = getCountryByCode(selectedCountryCode);

    const searchableSelectProps: SearcheableSelectProps<CountryItem> = {
        onChange: ({ value: countryItem }: SelectChangeEvent<CountryItem>) => {
            if (countryItem.value === DEFAULT_COUNTRIES_SEPARATOR.value) {
                return;
            }
            onChange?.(countryItem.value);
        },
        value: selectedCountryItem,
        search: (option, keyword) => {
            if (option.value.isTop) {
                return false;
            }

            return defaultFilterFunction(option, keyword);
        },
        placeholder: c('Placeholder').t`Select country`,
        children: countries.map((countryItem) => {
            const { key, value, label, disabled } = countryItem;

            return (
                <Option
                    key={key}
                    value={countryItem}
                    title={label}
                    disabled={disabled}
                    data-testid={`country-${value}`}
                >
                    {getCountriesDropdownLabel(countryItem)}
                </Option>
            );
        }),
        ...rest,
    };

    return <SearchableSelect {...searchableSelectProps} />;
};
