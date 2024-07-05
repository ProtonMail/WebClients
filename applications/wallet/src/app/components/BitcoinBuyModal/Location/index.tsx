import { useState } from 'react';

import { uniqBy } from 'lodash';
import { c } from 'ttag';

import { WasmApiCountry } from '@proton/andromeda';
import CountrySelect from '@proton/components/components/country/CountrySelect';

import { Button, CoreSearchableSelectProps, SearchableSelect } from '../../../atoms';
import { useCountriesByProvider } from '../../../store/hooks/useCountriesByProvider';

interface Props {
    onConfirm: (country: WasmApiCountry) => void;
}

export const Location = ({ onConfirm }: Props) => {
    const [countriesByProviders, loadingCountries] = useCountriesByProvider();
    const [country, setCountry] = useState<WasmApiCountry>();

    const allCountries = uniqBy(Object.values(countriesByProviders ?? {}).flat(), (country) => country.Code);
    const allCountryOptions = allCountries.map((country) => ({ countryCode: country.Code, countryName: country.Name }));

    return (
        <div className="flex flex-column max-w-full justify-center items-center">
            <h2 className="text-center text-semibold">{c('bitcoin buy').t`Location`}</h2>

            <p className="text-center mb-8 px-6 color-weak">{c('bitcoin buy')
                .t`Based on your location, we recommend the best provider and payment method for you.`}</p>

            <div className="mb-8 w-full">
                <CountrySelect
                    onSelectCountry={(code) => {
                        const country = allCountries.find((country) => country.Code === code);
                        if (country) {
                            setCountry(country);
                        }
                    }}
                    label={null}
                    disabled={loadingCountries}
                    options={allCountryOptions}
                    as={(props: CoreSearchableSelectProps<string>) => (
                        <SearchableSelect
                            bordered
                            disabled={loadingCountries}
                            label={c('bitcoin buy').t`Your location`}
                            placeholder={c('bitcoin buy').t`Choose a country`}
                            {...props}
                        />
                    )}
                />
            </div>

            <div className="w-full px-8">
                <Button
                    fullWidth
                    shadow
                    shape="solid"
                    color="norm"
                    disabled={!country}
                    onClick={() => {
                        if (country) {
                            onConfirm(country);
                        }
                    }}
                >{c('bitcoin buy').t`Confirm`}</Button>
            </div>
        </div>
    );
};
