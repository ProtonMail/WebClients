import { c } from 'ttag';

import { Info, Option, SelectTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const DefaultAccountSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="default-account" id="label-default-account">
                    <span className="mr-2">{c('Wallet Settings').t`Default account`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Set the default Bitcoin account for sending and receiving transactions with this wallet.`}
                    />
                </label>
            </SettingsLayoutLeft>

            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <SelectTwo id="default-account" aria-describedby="label-default-account">
                    <Option value="1" title="Account #1" />
                    <Option value="2" title="Account #2" />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
