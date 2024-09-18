import { useState } from 'react';

import uniqBy from 'lodash/uniqBy';
import { c } from 'ttag';

import type { WasmApiCountry } from '@proton/andromeda';
import { Href } from '@proton/atoms';
import CountrySelect from '@proton/components/components/country/CountrySelect';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { useCountriesByProvider } from '@proton/wallet/store';

import type { CoreSearchableSelectProps } from '../../../atoms';
import { Button, SearchableSelect } from '../../../atoms';
import { ModalParagraph } from '../../../atoms/ModalParagraph';

interface Props {
    onConfirm: (country: WasmApiCountry) => void;
}

export const Location = ({ onConfirm }: Props) => {
    const [countriesByProviders, loadingCountries] = useCountriesByProvider();
    const [country, setCountry] = useState<WasmApiCountry>();

    const allCountries = uniqBy(Object.values(countriesByProviders ?? {}).flat(), (country) => country.Code);
    const allCountryOptions = allCountries.map((country) => ({ countryCode: country.Code, countryName: country.Name }));

    const rampLink = <Href href="https://ramp.network">{c('bitcoin buy').t`Ramp`}</Href>;
    const banxaLink = <Href href="https://banxa.com">{c('bitcoin buy').t`Banxa`}</Href>;
    const binanceLink = <Href href="https://binance.com">{c('bitcoin buy').t`Binance`}</Href>;
    const coinbaseLink = <Href href="https://coinbase.com">{c('bitcoin buy').t`Coinbase`}</Href>;
    const krakenLink = <Href href="https://kraken.com">{c('bitcoin buy').t`Kraken`}</Href>;

    return (
        <div className="flex flex-column max-w-full justify-center items-center">
            <h2 className="text-center text-semibold mb-3">{c('bitcoin buy').t`Location`}</h2>

            <ModalParagraph className="max-w-custom" style={{ '--max-w-custom': '26rem' }}>
                <p>{c('bitcoin buy')
                    .jt`${WALLET_APP_NAME} has partnered with ${rampLink} and ${banxaLink}, two registered crypto asset services, to facilitate the purchase of BTC. Please enter your region to see the available providers and payment methods.`}</p>
                <p>{c('bitcoin buy')
                    .t`Finally, you will complete the Buy process on the provider’s site and any purchased BTC will be sent to a BTC address generated from your wallet account.`}</p>
                <p>{c('bitcoin buy')
                    .jt`You can also buy BTC on exchanges like ${binanceLink}, ${coinbaseLink}, or ${krakenLink} and then send the BTC to your Receive address.`}</p>
            </ModalParagraph>

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
                            disabled={loadingCountries}
                            label={c('bitcoin buy').t`Your location`}
                            placeholder={c('bitcoin buy').t`Choose a country`}
                            {...props}
                        />
                    )}
                    assistContainerClassName="empty:hidden"
                />
            </div>

            <div className="w-full px-8">
                <Button
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                    shadow
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
