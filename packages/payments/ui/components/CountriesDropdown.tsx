import { useMemo, useState } from 'react';

import Option from '@proton/components/components/option/Option';
import type { SearcheableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import { defaultFilterFunction } from '@proton/components/components/selectTwo/helpers';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { type CountryItem, DEFAULT_COUNTRIES_SEPARATOR, getFullList } from '../helpers/countries-sorted';

export const useCountries = () => {
    const countries = useMemo(() => getFullList(), []);

    const [country, innerSetCountry] = useState(countries[0]);

    const getCountryByValue = (value: string) => countries.find((country) => country.value === value) ?? countries[0];

    const setCountry = (value: string) => {
        if (value === DEFAULT_COUNTRIES_SEPARATOR.value) {
            return;
        }

        innerSetCountry(getCountryByValue(value));
    };

    const getCountryByCode = (countryCode: string) => countries.find((country) => country.value === countryCode);

    return { countries, country, setCountry, getCountryByCode };
};

interface Props {
    onChange?: (countryCode: string) => void;
    selectedCountryCode: string;
    autoComplete?: string;
    'data-testid'?: string;
    id?: string;
    unstyled?: boolean;
    className?: string;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    disabled?: boolean;
}

export const CountriesDropdown = ({ onChange, selectedCountryCode, ...rest }: Props) => {
    const { countries, getCountryByCode } = useCountries();
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
                    {value === DEFAULT_COUNTRIES_SEPARATOR.value ? <hr className="m-0" /> : label}
                </Option>
            );
        }),
        ...rest,
    };

    return <SearchableSelect {...searchableSelectProps} />;
};
