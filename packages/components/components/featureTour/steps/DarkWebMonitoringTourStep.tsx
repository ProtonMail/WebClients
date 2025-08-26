import { c } from 'ttag';

import { useUserSettings, userSettingsActions } from '@proton/account';
import { featureTourActions } from '@proton/account/featuresTour';
import useApi from '@proton/components/hooks/useApi';
import useToggle from '@proton/components/hooks/useToggle';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import { SentryMailInitiatives, traceError } from '@proton/shared/lib/helpers/sentry';
import { DARK_WEB_MONITORING_STATE } from '@proton/shared/lib/interfaces';
import darkWebMonitoringIllustration from '@proton/styles/assets/img/illustrations/dwm-upsell-shield.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';
import FeatureTourToggle from './components/FeatureTourToggle';

export const shouldDisplayDarkWebMonitoringTourStep: ShouldDisplayTourStep = async () => ({
    canDisplay: true,
    preloadUrls: [darkWebMonitoringIllustration],
});

const DarkWebMonitoringTourStep = (props: FeatureTourStepProps) => {
    const api = useApi();
    const dispatch = useDispatch();
    const [userSettings] = useUserSettings();
    const { state: isToggleChecked, toggle } = useToggle(true);
    const isFeatureEnabled = userSettings.BreachAlerts.Value === DARK_WEB_MONITORING_STATE.ENABLED;

    const handleEnableFeature = async () => {
        if (isToggleChecked && !isFeatureEnabled) {
            try {
                await api(enableBreachAlert());
                dispatch(
                    userSettingsActions.update({
                        UserSettings: {
                            ...userSettings,
                            BreachAlerts: {
                                ...userSettings.BreachAlerts,
                                Value: DARK_WEB_MONITORING_STATE.ENABLED,
                            },
                        },
                    })
                );

                dispatch(featureTourActions.activateFeature({ feature: 'dark-web-monitoring' }));
            } catch (error) {
                traceError(error, { tags: { initiative: SentryMailInitiatives.MAIL_ONBOARDING } });
            }
        }
    };

    const darkWebMonitoring = <strong key="dwmstrong">{DARK_WEB_MONITORING_NAME}</strong>;

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            illustrationSize="small"
            illustration={darkWebMonitoringIllustration}
            title={DARK_WEB_MONITORING_NAME}
            mainCTA={
                <FeatureTourStepCTA
                    type="primary"
                    onClick={() => {
                        void handleEnableFeature();
                        props.onNext();
                    }}
                >
                    {c('Button').t`Next`}
                </FeatureTourStepCTA>
            }
        >
            <p className="mt-0 mb-4">
                {c('Info').t`Get notified if your password or other data was leaked from a third-party service.`}
            </p>
            <FeatureTourToggle
                isFeatureEnabled={isFeatureEnabled}
                checked={isToggleChecked}
                onToggle={toggle}
                title={c('Action').jt`Enable ${darkWebMonitoring}`}
            />
        </FeatureTourStepsContent>
    );
};

export default DarkWebMonitoringTourStep;
