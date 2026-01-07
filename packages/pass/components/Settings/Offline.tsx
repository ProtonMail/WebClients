import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { useOfflineSetup } from '@proton/pass/hooks/auth/useOfflineSetup';
import { selectOfflineEnabled } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const [setup, loading] = useOfflineSetup();

    const enabled = useSelector(selectOfflineEnabled);
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
                                disabled={loading}
                                loading={loading}
                                onClick={setup}
                            >{c('Label').t`Enable offline access`}</Button>
                        )}
                    </div>
                </div>
            </SettingsPanel>
        </>
    );
};
