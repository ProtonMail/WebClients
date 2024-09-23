import { useCallback, useEffect } from 'react';

import { useApi, useUserSettings, useWelcomeFlags } from '@proton/components/hooks';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useMailOnboardingTelemetry } from '../useMailOnboardingTelemetry';
import useMailOnboardingVariant from '../useMailOnboardingVariant';
import NewMailOnboardingModalVariant from './variants/new/NewMailOnboardingVariant';
import OldMailOnboardingModal from './variants/old/OldMailOnboardingVariant';

export interface MailOnboardingProps {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const MailOnboardingModal = (props: MailOnboardingProps) => {
    const api = useApi();
    const { changeChecklistDisplay } = useGetStartedChecklist();
    const [welcomeFlags] = useWelcomeFlags();
    const [userSettings] = useUserSettings();
    const { variant, isEnabled } = useMailOnboardingVariant();
    const [sendMailOnboardingTelemetry, loadingTelemetryDeps] = useMailOnboardingTelemetry();

    const handleDone = useCallback(() => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.finish_onboarding_modals, {});
        props.onDone?.();
    }, [sendMailOnboardingTelemetry]);

    // Specific for Telemetry
    useEffect(() => {
        if (!isEnabled || loadingTelemetryDeps || variant === 'none') {
            return;
        }

        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.start_onboarding_modals, {});
    }, [loadingTelemetryDeps]);

    // Specific for 'NONE' variant
    useEffect(() => {
        // For the none variant, can directly call onDone to update welcome flags
        if (variant === 'none') {
            if (welcomeFlags.isWelcomeFlow) {
                // Set generic welcome to true
                void api(updateFlags({ Welcomed: 1 })).catch(noop);
            }
            if (!userSettings.WelcomeFlag) {
                // Set product specific welcome to true
                void api(updateWelcomeFlags()).catch(noop);
            }

            changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED);

            // Using orignal onDone callback as 'none' variant does not need start or end
            props.onDone?.();
        }
    }, []);

    if (variant === 'new') {
        return <NewMailOnboardingModalVariant {...props} onDone={handleDone} data-testid="new-onboarding-variant" />;
    }

    if (variant === 'old') {
        return <OldMailOnboardingModal {...props} onDone={handleDone} data-testid="old-onboarding-variant" />;
    }

    // Render nothing if variant is none
    return null;
};

export default MailOnboardingModal;
