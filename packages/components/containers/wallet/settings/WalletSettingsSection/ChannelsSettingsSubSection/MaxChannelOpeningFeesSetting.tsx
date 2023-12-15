import { c } from 'ttag';

import { Info, InputFieldTwo } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const MaxChannelOpeningFeesSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-top">
            <SettingsLayoutLeft>
                <label className="text-semibold block mt-2" htmlFor="max-channel-opening-fees">
                    <span className="mr-2">{c('Wallet Settings').t`Max channel opening fees`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Maximum acceptable channel opening fees. Channel opening with fees higher will be rejected.`}
                    />
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <InputFieldTwo type="number" min={0} id="max-channel-opening-fees" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
