import { c } from 'ttag';

import { Info, Option, SelectTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const FiatCurrencySetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="fiat-currency" id="label-fiat-currency">
                    <span className="mr-2">{c('Wallet Settings').t`Fiat Currency`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Choose your fiat currency for instant Bitcoin conversion rates, simplifying transactions and portfolio tracking in your local currency.`}
                    />
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <SelectTwo id="fiat-currency" aria-describedby="label-fiat-currency">
                    <Option value="usd" title="USD" />
                    <Option value="chf" title="CHF" />
                    <Option value="eur" title="EUR" />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
