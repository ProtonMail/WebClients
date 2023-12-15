import { c } from 'ttag';

import { Info, Toggle } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';

export const HideEmptyUsedAddressesSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="hide-empty-used-addresses">
                    <span className="mr-2">{c('Wallet Settings').t`Hide empty used addresses`}</span>
                    <Info
                        title={c('Wallet Settings')
                            .t`Hide used addresses as soon as they are emptied to avoid reusing them`}
                    />
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <Toggle
                    id="hide-empty-used-addresses"
                    // checked={isEnabled}
                    // disabled={!canEnable}
                    // onChange={() => withLoading(onChange())}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
