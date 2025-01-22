import { c } from 'ttag';

import { useUserSettings, userSettingsActions } from '@proton/account';
import { featureTourActions } from '@proton/account/featuresTour';
import useApi from '@proton/components/hooks/useApi';
import useToggle from '@proton/components/hooks/useToggle';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import { SentryMailInitiatives, traceError } from '@proton/shared/lib/helpers/sentry';
import { DARK_WEB_MONITORING_STATE, type UserSettings } from '@proton/shared/lib/interfaces';
import darkWebMonitoringIllustration from '@proton/styles/assets/img/illustrations/dwm-upsell-shield.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';
import FeatureTourToggle from './components/FeatureTourToggle';

export const shouldDisplayDarkWebMonitoringTourStep: ShouldDisplayTourStep = async () => true;

const DarkWebMonitoringTourStep = (props: FeatureTourStepProps) => {
    const api = useApi();
    const dispatch = useDispatch();
    const [userSettings] = useUserSettings();
    const { state: isToggleChecked, toggle } = useToggle(true);
    const isFeatureEnabled = userSettings.BreachAlerts.Value === DARK_WEB_MONITORING_STATE.ENABLED;

    const handleEnableFeature = async () => {
        if (isToggleChecked && !isFeatureEnabled) {
            try {
                const { UserSettings } = await api<{ UserSettings: UserSettings }>(enableBreachAlert());
                dispatch(userSettingsActions.update({ UserSettings }));
                dispatch(featureTourActions.activateFeature({ feature: 'dark-web-monitoring' }));
            } catch (error) {
                traceError(error, { tags: { initiative: SentryMailInitiatives.MAIL_ONBOARDING } });
            }
        }
    };

    const darkWebMonitoring = <strong key="dwmstrong">{DARK_WEB_MONITORING_NAME}</strong>;

    return (
        <FeatureTourStepsContent
            illustrationSize="small"
            illustration={darkWebMonitoringIllustration}
            title={DARK_WEB_MONITORING_NAME}
            description={c('Info')
                .t`Get notified if your password or other data was leaked from a third-party service.`}
            {...props}
            onNext={() => {
                void handleEnableFeature();
                props.onNext();
            }}
        >
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
