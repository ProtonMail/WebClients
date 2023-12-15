import { c } from 'ttag';

import { Info, Toggle } from '@proton/components/components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/containers/account';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

export const HideAccountsSetting = () => {
    return (
        <SettingsLayout className="flex flex-row flex-align-items-center">
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="hide-accounts">
                    <span className="mr-2">{c('Wallet Settings').t`Hide accounts`}</span>
                    <Info
                        title={c('Wallet Settings').t`Simplify ${WALLET_APP_NAME} interface by hiding account entity.`}
                    />
                </label>
            </SettingsLayoutLeft>
            {/* TODO: Connect this selector to API */}
            <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                <Toggle
                    id="hide-accounts"
                    // checked={isEnabled}
                    // disabled={!canEnable}
                    // onChange={() => withLoading(onChange())}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
