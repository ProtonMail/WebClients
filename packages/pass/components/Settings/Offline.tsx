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
import { selectOfflineEnabled, selectPassPlan } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const dispatch = useDispatch();
    const passwordConfirmModal = useAsyncModalHandles<string>();
    const supported = useSelector(selectOfflineEnabled);
    const setup = useActionRequest({ action: offlineSetupIntent });
    const plan = useSelector(selectPassPlan);
    const disabled = !isPaidPlan(plan);

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
                          subTitle: c('Info').t`Please upgrade your plan to enable offline support.`,
                          contentClassname: 'opacity-50 pointer-events-none py-4',
                          actions: [
                              <UpgradeButton upsellRef={UpsellRef.SETTING} inline className="text-sm" key="upgrade" />,
                          ],
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
