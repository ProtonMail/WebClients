import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components/index';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { offlineToggle } from '@proton/pass/store/actions';
import { offlineToggleRequest } from '@proton/pass/store/actions/requests';
import { selectOfflineEnabled, selectPassPlan, selectUserSettings } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';

import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const confirmPassword = usePasswordUnlock();

    const enabled = useSelector(selectOfflineEnabled);
    const plan = useSelector(selectPassPlan);
    const pwMode = useSelector(selectUserSettings)?.Password?.Mode;
    const toggle = useRequest(offlineToggle, { initialRequestId: offlineToggleRequest() });

    const freeUser = !isPaidPlan(plan);
    const twoPasswordMode = pwMode === SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE;
    const disabled = freeUser || twoPasswordMode;

    const toggleOffline = async (enabled: boolean) =>
        confirmPassword({
            onSubmit: (loginPassword) => toggle.dispatch({ loginPassword, enabled }),
            message: c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`,
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
