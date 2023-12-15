import { c } from 'ttag';

import { Info, Option, SelectTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const BitcoinUnitSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="bitcoin-unit" id="label-bitcoin-unit">
                    <span className="mr-2">{c('Wallet Settings').t`Bitcoin unit`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Switch between Bitcoin units for a personalized view. Pick from different options like BTC, mBTC, or sats to suit your style.`}
                    />
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <SelectTwo id="bitcoin-unit" aria-describedby="label-bitcoin-unit">
                    <Option value="sats" title="Sats" />
                    <Option value="mbtc" title="mBTC" />
                    <Option value="btc" title="BTC" />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
