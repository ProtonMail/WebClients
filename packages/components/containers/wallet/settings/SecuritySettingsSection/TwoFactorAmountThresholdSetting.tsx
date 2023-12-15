import { c } from 'ttag';

import { Info, InputFieldTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

export const TwoFactorAmountThresholdSetting = () => {
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
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <InputFieldTwo type="number" min={0} id="2fa-amount-threshold" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
