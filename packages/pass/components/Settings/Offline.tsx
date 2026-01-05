import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { usePasswordTypeSwitch, usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { offlineToggle } from '@proton/pass/store/actions';
import { selectOfflineEnabled } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const confirmPassword = usePasswordUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();
    const enabled = useSelector(selectOfflineEnabled);

    const toggle = useRequest(offlineToggle, { initial: true });

    const setupOffline = async () =>
        confirmPassword({
            reauth: {
                type: ReauthAction.OFFLINE_SETUP,
                fork: { promptBypass: 'none', promptType: 'offline' },
            },
            onSubmit: (loginPassword) => toggle.dispatch({ loginPassword, enabled: true }),
            message: passwordTypeSwitch({
                extra: c('Info').t`Please confirm your extra password in order to enable offline mode`,
                sso: c('Info').t`Please confirm your backup password in order to enable offline mode`,
                twoPwd: c('Info').t`Please confirm your second password in order to enable offline mode`,
                default: c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`,
            }),
        });

    const signalColor = enabled ? 'color-success' : 'color-warning';

    return (
        <>
            <SettingsPanel title={c('Label').t`Offline mode`}>
                <div className="flex gap-2 flex-row items-start">
                    <Icon
                        name={enabled ? 'checkmark-circle-filled' : 'cross-circle-filled'}
                        className={clsx('shrink-0 mt-0.5', signalColor)}
                    />
                    <div className="flex-1 flex gap-3">
                        <div>
                            <span className={clsx('block', signalColor)}>
                                {enabled
                                    ? c('Info').t`${PASS_SHORT_APP_NAME} offline mode enabled.`
                                    : c('Warning').t`${PASS_SHORT_APP_NAME} offline mode disabled.`}
                            </span>
                            <span className="text-sm color-weak lh100">
                                {enabled
                                    ? c('Info')
                                          .t`When enabled, you can still access your ${PASS_SHORT_APP_NAME} data if you lose internet connectivity or if ${BRAND_NAME} servers are unreachable.`
                                    : c('Info')
                                          .t`Enable offline mode to access your ${PASS_SHORT_APP_NAME} data if you lose internet connectivity or if ${BRAND_NAME} servers are unreachable.`}
                            </span>
                        </div>

                        {!enabled && (
                            <Button
                                color="norm"
                                shape="outline"
                                disabled={toggle.loading}
                                loading={toggle.loading}
                                onClick={setupOffline}
                            >{c('Label').t`Enable offline access`}</Button>
                        )}
                    </div>
                </div>
            </SettingsPanel>
        </>
    );
};
