import { useUserSettings, userSettingsActions } from '@proton/account';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight, SettingsSection } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import { getEnableString } from '@proton/components/containers/credentialLeak/helpers';
import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';
import { setProductDisabled } from '@proton/shared/lib/api/settings';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, PRODUCT } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { useAccountDispatch } from '../../store/hooks';

export const WalletAuthorizationPage = () => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [userSettings] = useUserSettings();
    const hasWalletEnabled = userSettings?.ProductDisabled?.Wallet !== 1;
    const dispatch = useAccountDispatch();

    const handleWalletToggle = async (value: boolean) => {
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            setProductDisabled({
                Disabled: value ? 0 : 1,
                Product: PRODUCT.WALLET,
            })
        );
        dispatch(userSettingsActions.set({ UserSettings }));
    };

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="data-wallet-toggle">
                        <span className="mr-2">{getEnableString(getAppName(APPS.PROTONWALLET))}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="data-wallet-toggle"
                        disabled={false}
                        checked={hasWalletEnabled}
                        loading={loading}
                        onChange={({ target }) => {
                            void withLoading(handleWalletToggle(target.checked));
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};
