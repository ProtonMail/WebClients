import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components/index';
import { ConfirmPasswordModal } from '@proton/pass/components/Confirmation/ConfirmPasswordModal';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { offlineDisable, offlineSetupIntent } from '@proton/pass/store/actions';
import { selectOfflineEnabled, selectPassPlan, selectUserSettings } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';

import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const dispatch = useDispatch();
    const passwordConfirmModal = useAsyncModalHandles<string>();

    const supported = useSelector(selectOfflineEnabled);
    const plan = useSelector(selectPassPlan);
    const pwMode = useSelector(selectUserSettings)?.Password?.Mode;
    const setup = useActionRequest(offlineSetupIntent);

    const freeUser = !isPaidPlan(plan);
    const twoPasswordMode = pwMode === SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE;
    const disabled = freeUser || twoPasswordMode;

    const toggleOffline = async (enable: boolean) => {
        if (enable) {
            await passwordConfirmModal.handler({
                onSubmit: (password) => {
                    setup.dispatch(password);
                },
            });
        } else dispatch(offlineDisable());
    };

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
                    checked={supported}
                    disabled={setup.loading || disabled}
                    loading={setup.loading}
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
                <ConfirmPasswordModal
                    message={c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`}
                    onSubmit={passwordConfirmModal.resolver}
                    onClose={passwordConfirmModal.abort}
                    {...passwordConfirmModal.state}
                />
            </SettingsPanel>
        </>
    );
};
