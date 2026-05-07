import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectBetaEnabled } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

/** Limit beta enabling to the cohort having the `PassWebInternalAlpha`
 * flag for now. FIXME: remove this when leveraging the user settings */
export const useShowBetaWeb = () => useFeatureFlag(PassFeature.PassWebInternalAlpha) && BUILD_TARGET === 'web';

const useToggleBeta = () => {
    const dispatch = useDispatch();
    const betaEnabled = useSelector(selectBetaEnabled);
    const onToggle = () => dispatch(settingsEditIntent('behaviors', { beta: !betaEnabled }));
    return { betaEnabled, onToggle };
};

export const Beta: FC = () => {
    const featureFlagWebAlpha = useFeatureFlag(PassFeature.PassWebInternalAlpha);
    const { betaEnabled, onToggle } = useToggleBeta();

    if (!featureFlagWebAlpha) return null;

    return (
        <SettingsPanel title={c('Label').t`Beta Access`}>
            <Toggle checked={betaEnabled} onChange={onToggle} className="max-h-full">
                <span className="pl-2">
                    {c('Info').t`Enable ${PASS_SHORT_APP_NAME} beta`}
                    <span className="block color-weak text-sm">
                        {c('Info')
                            .t`Try new ${BRAND_NAME} features, updates and products before they are released to the public.`}
                        {c('Info').t`This will reload the application.`}
                    </span>
                </span>
            </Toggle>
        </SettingsPanel>
    );
};
