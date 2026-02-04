import { type FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectBetaEnabled } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SettingsPanel } from './SettingsPanel';

/** On Web:
 * Limit beta enabling to the cohort having the `PassWebInternalAlpha`
 * flag for now. FIXME: remove this when leveraging the user settings
 * On Desktop:
 * Limit beta to the ones having `PassDesktopBeta` flag.
 * No decisions yet about desktop beta should be sync on user settings */
export const useShowBeta = () => {
    const webAlpha = useFeatureFlag(PassFeature.PassWebInternalAlpha);
    const desktopBeta = useFeatureFlag(PassFeature.PassDesktopBeta);

    return (BUILD_TARGET === 'web' && webAlpha) || (DESKTOP_BUILD && desktopBeta);
};

type ToggleBeta = {
    betaEnabled: boolean;
    onToggle: () => void;
};

const useToggleBetaWeb = () => {
    const dispatch = useDispatch();
    const betaEnabled = useSelector(selectBetaEnabled);
    const onToggle = () => dispatch(settingsEditIntent('behaviors', { beta: !betaEnabled }));
    return { betaEnabled, onToggle };
};

const useToggleBetaDesktop = () => {
    const { createNotification } = useNotifications();
    const [betaEnabled, setBetaEnabled] = useState(false);
    useEffect(() => {
        void window.ctxBridge?.getBetaOptIn().then((value) => setBetaEnabled(value));
    }, []);
    const onToggle = async () => {
        const newValue = !betaEnabled;
        await window.ctxBridge?.setBetaOptIn(newValue);
        setBetaEnabled(newValue);
        if (newValue) {
            const result = await window.ctxBridge?.checkForUpdates();
            createNotification({
                text: result
                    ? c('Info')
                          .t`A new version is being downloaded. Once the download completes, it will be available on next restart.`
                    : c('Info').t`No new versions are available at the moment.`,
            });
        }
    };
    return { betaEnabled, onToggle };
};

/** Not really conventionnal but route logic between web and desktop logic.
 * As it can't change during execution, rules of hooks will be respected */
const useToggleBeta = (): ToggleBeta => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (BUILD_TARGET === 'web') return useToggleBetaWeb();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (DESKTOP_BUILD) return useToggleBetaDesktop();
    return { betaEnabled: false, onToggle: noop };
};

export const Beta: FC = () => {
    const { betaEnabled, onToggle } = useToggleBeta();

    return (
        <SettingsPanel title={c('Label').t`Beta Access`}>
            <div className="pt-2">
                <Toggle checked={betaEnabled} onChange={onToggle}>
                    <span className="pl-2">
                        {c('Info').t`Enable ${PASS_SHORT_APP_NAME} beta`}
                        <span className="block color-weak text-sm">
                            {c('Info')
                                .t`Try new ${BRAND_NAME} features, updates and products before they are released to the public.`}
                            {BUILD_TARGET === 'web' && c('Info').t`This will reload the application.`}
                            {DESKTOP_BUILD && c('Info').t`This will trigger a check for new beta releases.`}
                        </span>
                    </span>
                </Toggle>
            </div>
        </SettingsPanel>
    );
};
