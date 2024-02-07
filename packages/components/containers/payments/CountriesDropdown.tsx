import { useMemo, useState } from 'react';

import { Option, SelectTwo } from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { DEFAULT_SEPARATOR, getFullList } from '@proton/components/helpers/countries';

export const useCountries = () => {
    const countries = useMemo(
        () => getFullList().map(({ key, value, label: text, disabled }) => ({ key, value, text, disabled })),
        []
    );

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
    const { countries } = useCountries();

    return (
        <SelectTwo
            onChange={({ value }: SelectChangeEvent<string>) => {
                if (value === DEFAULT_SEPARATOR.value) {
                    return;
                }
                onChange?.(value);
            }}
            value={selectedCountryCode}
            {...rest}
        >
            {countries.map(({ key, value, text, disabled }) => {
                return (
                    <Option key={key} value={value} title={text} disabled={disabled} data-testid={`country-${value}`}>
                        {value === DEFAULT_SEPARATOR.value ? <hr className="m-0" /> : text}
                    </Option>
                );
            })}
        </SelectTwo>
    );
};

export default CountriesDropdown;
