import { c } from 'ttag';

import { WasmBitcoinUnit } from '@proton/andromeda';
import { Info, Option, SelectTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { setBitcoinUnitEvent, useWalletApi, useWalletSettings } from '@proton/wallet';

export const BitcoinUnitSetting = () => {
    const api = useWalletApi();
    const [walletSettings, loadingSettingsFetch] = useWalletSettings();
    const [loadingSettingsUpdate, withLoadingUpdate] = useLoading();
    const dispatch = useDispatch();

    const { createNotification } = useNotifications();

    const onChange = async (value: WasmBitcoinUnit) => {
        try {
            await api.settings().setBitcoinUnit(value);

            dispatch(setBitcoinUnitEvent(value));
            createNotification({ text: c('Info').t`Prefered bitcoin unit saved` });
        } catch (error) {
            createNotification({ text: c('Info').t`Could not save preferred bitcoin unit` });
        }
    };

    const loading = loadingSettingsFetch || loadingSettingsUpdate;

    return (
        <SettingsLayout className="flex flex-row items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="bitcoin-unit" id="label-bitcoin-unit">
                    <span className="mr-2">{c('Wallet Settings').t`Bitcoin unit`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Switch between Bitcoin units for a personalized view. Pick from different options like BTC, mBTC, or sats to suit your style.`}
                    />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight className="pt-2 flex items-center">
                <SelectTwo
                    id="bitcoin-unit"
                    aria-describedby="label-bitcoin-unit"
                    value={walletSettings?.BitcoinUnit}
                    disabled={loading}
                    onChange={(e) => withLoadingUpdate(onChange(e.value))}
                >
                    <Option value={'SATS'} title="Sats" />
                    <Option value={'MBTC'} title="mBTC" />
                    <Option value={'BTC'} title="BTC" />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
