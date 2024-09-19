import { useMemo, useState } from 'react';

import Option from '@proton/components/components/option/Option';
import type { Props as SearchableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import { defaultFilterFunction } from '@proton/components/components/selectTwo/helpers';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import type { CountryItem } from '@proton/components/helpers/countries';
import { DEFAULT_SEPARATOR, getFullList } from '@proton/components/helpers/countries';

export const useCountries = () => {
    const countries = useMemo(() => getFullList(), []);

    const [country, innerSetCountry] = useState(countries[0]);

    const getCountryByValue = (value: string) => countries.find((country) => country.value === value) ?? countries[0];

    const setCountry = (value: string) => {
        if (value === DEFAULT_SEPARATOR.value) {
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
}

const CountriesDropdown = ({ onChange, selectedCountryCode, ...rest }: Props) => {
    const { countries, getCountryByCode } = useCountries();
    const selectedCountryItem = getCountryByCode(selectedCountryCode);

    const searchableSelectProps: SearchableSelectProps<CountryItem> = {
        onChange: ({ value: countryItem }: SelectChangeEvent<CountryItem>) => {
            if (countryItem.value === DEFAULT_SEPARATOR.value) {
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
                    {value === DEFAULT_SEPARATOR.value ? <hr className="m-0" /> : label}
                </Option>
            );
        }),
        ...rest,
    };

    return <SearchableSelect {...searchableSelectProps} />;
};

export default CountriesDropdown;
