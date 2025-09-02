import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePasswordTypeSwitch, usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { offlineToggle } from '@proton/pass/store/actions';
import { selectHasTwoPasswordMode, selectOfflineEnabled, selectPassPlan } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const confirmPassword = usePasswordUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();
    const authStore = useAuthStore();

    const enabled = useSelector(selectOfflineEnabled);
    const plan = useSelector(selectPassPlan);
    const freeUser = !isPaidPlan(plan);
    const twoPwdMode = useSelector(selectHasTwoPasswordMode);

    const validUserType = !freeUser;
    const validPasswordMode = !twoPwdMode || (authStore?.hasOfflinePassword() ?? false);
    const canEnableOffline = validUserType && validPasswordMode;
    const disabled = !canEnableOffline;

    const toggle = useRequest(offlineToggle, { initial: true });
    offlineToggle.requestID();

    const toggleOffline = async (enabled: boolean) =>
        confirmPassword({
            reauth: {
                type: ReauthAction.SSO_OFFLINE,
                fork: { promptBypass: 'none', promptType: 'offline' },
            },
            onSubmit: (loginPassword) => toggle.dispatch({ loginPassword, enabled }),
            message: passwordTypeSwitch({
                extra: enabled
                    ? c('Info').t`Please confirm your extra password in order to enable offline mode`
                    : c('Info').t`Please confirm your extra password in order to disable offline mode`,
                sso: enabled
                    ? c('Info').t`Please confirm your backup password in order to enable offline mode`
                    : c('Info').t`Please confirm your backup password in order to disable offline mode`,
                twoPwd: enabled
                    ? c('Info').t`Please confirm your second password in order to enable offline mode`
                    : c('Info').t`Please confirm your second password in order to disable offline mode`,
                default: enabled
                    ? c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`
                    : c('Info').t`Please confirm your ${BRAND_NAME} password in order to disable offline mode`,
            }),
        });

    return (
        <>
            <SettingsPanel
                title={c('Label').t`Offline mode`}
                {...(disabled
                    ? {
                          contentClassname: 'opacity-50 pointer-events-none py-4',
                          actions: freeUser
                              ? [
                                    <UpgradeButton
                                        upsellRef={UpsellRef.SETTING}
                                        inline
                                        className="text-sm"
                                        key="upgrade"
                                    />,
                                ]
                              : [],
                          subTitle: freeUser
                              ? c('Error')
                                    .t`Offline mode isn't currently available for your plan and not compatible with two password mode.`
                              : c('Error').t`Offline mode is currently not available for two password mode.`,
                      }
                    : {})}
            >
                <Checkbox
                    checked={enabled}
                    disabled={toggle.loading || disabled}
                    loading={toggle.loading}
                    onChange={(e) => toggleOffline(e.target.checked)}
                >
                    <span>
                        {c('Label').t`Enable offline access`}
                        <span className="block color-weak text-sm">
                            {c('Info')
                                .t`${PASS_APP_NAME} will require your ${BRAND_NAME} password in order to access data offline.`}
                        </span>
                    </span>
                </Checkbox>
            </SettingsPanel>
        </>
    );
};
