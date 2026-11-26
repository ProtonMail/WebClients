import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useOfflineSetup } from '../../hooks/auth/useOfflineSetup';
import { selectOfflineEnabled } from '../../store/selectors/settings';
import { SettingsPanel } from './SettingsPanel';

/** Deep-link intent param (e.g. from the on-page prompt CTA):
 * auto-triggers the password-confirmation setup flow on mount. */
const SETUP_PARAM = 'offline';
const SETUP_VALUE = 'setup';

export const Offline: FC = () => {
    const [setup, loading] = useOfflineSetup();
    const enabled = useSelector(selectOfflineEnabled);
    const history = useHistory();
    const location = useLocation();
    const panelRef = useRef<HTMLDivElement>(null);
    const params = new URLSearchParams(location.search);
    const deepLinked = params.get(SETUP_PARAM) === SETUP_VALUE;

    useEffect(() => {
        if (deepLinked && !enabled) setup().catch(noop);
        if (deepLinked) history.replace({ search: '' });
    }, [deepLinked, enabled]);

    /** Scroll the offline panel into view when deep-linked */
    useEffect(() => {
        if (deepLinked) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [deepLinked]);

    const signalColor = enabled ? 'color-success' : 'color-warning';

    return (
        <div ref={panelRef}>
            <SettingsPanel title={c('Label').t`Offline mode`}>
                <div className="flex gap-2 flex-row items-start">
                    {enabled ? (
                        <IcCheckmarkCircleFilled className={clsx('shrink-0 mt-0.5', signalColor)} />
                    ) : (
                        <IcCrossCircleFilled className={clsx('shrink-0 mt-0.5', signalColor)} />
                    )}
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
        </div>
    );
};
