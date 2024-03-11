import { ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Info, InputFieldTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { setTwoFaThresholdEvent, useWalletApi, useWalletSettings } from '@proton/wallet';

export const TwoFactorAmountThresholdSetting = () => {
    const api = useWalletApi();
    const [amount, setAmount] = useState(0);
    const [walletSettings, loadingSettingsFetch] = useWalletSettings();
    const [loadingSettingsUpdate, withLoadingUpdate] = useLoading();
    const dispatch = useDispatch();

    const { createNotification } = useNotifications();

    const onSubmit = async () => {
        if (!amount || amount === walletSettings?.TwoFactorAmountThreshold) {
            return;
        }

        try {
            await api.settings().setTwoFaThreshold(BigInt(amount));
            dispatch(setTwoFaThresholdEvent(amount));

            createNotification({ text: c('Info').t`Threshold amount saved` });
        } catch (error) {
            createNotification({ text: c('Info').t`Could not save threshold amount` });
        }
    };

    useEffect(() => {
        if (walletSettings?.TwoFactorAmountThreshold) {
            setAmount(walletSettings.TwoFactorAmountThreshold);
        }
    }, [walletSettings?.TwoFactorAmountThreshold]);

    const loading = loadingSettingsFetch || loadingSettingsUpdate;

    return (
        <SettingsLayout className="flex flex-row flex-align-items-top">
            <SettingsLayoutLeft>
                <label className="text-semibold block mt-2" htmlFor="2fa-amount-threshold">
                    <span className="mr-2">{c('Wallet Settings').t`2FA amount threshold`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Transaction above this threshold will require 2FA to be processed using ${WALLET_APP_NAME}.`}
                    />
                </label>
            </SettingsLayoutLeft>

            <SettingsLayoutRight>
                <form
                    className="pt-2 flex flex-row items-start"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void withLoadingUpdate(onSubmit());
                    }}
                >
                    <div>
                        <InputFieldTwo
                            type="number"
                            min={0}
                            step={1}
                            id="2fa-amount-threshold"
                            disabled={loading}
                            value={amount}
                            className="mr-4"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setAmount(Number(e.target.value));
                            }}
                        />
                    </div>

                    <Button
                        shape="outline"
                        type="submit"
                        disabled={!amount || amount === walletSettings?.TwoFactorAmountThreshold}
                        loading={loading}
                    >
                        {c('Action').t`Save`}
                    </Button>
                </form>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
