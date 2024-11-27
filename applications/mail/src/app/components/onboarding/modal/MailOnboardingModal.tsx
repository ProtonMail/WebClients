import { useCallback, useEffect } from 'react';

import { useWelcomeFlags } from '@proton/account';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';

import { useMailOnboardingTelemetry } from '../useMailOnboardingTelemetry';
import NewMailOnboardingModalVariant from './variants/new/NewMailOnboardingVariant';

export interface MailOnboardingProps {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onClose?: () => void;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const MailOnboardingModal = (props: MailOnboardingProps) => {
    const { endReplay } = useWelcomeFlags();
    const [sendMailOnboardingTelemetry, loadingTelemetryDeps] = useMailOnboardingTelemetry();

    const handleDone = useCallback(() => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.finish_onboarding_modals, {});
        props.onDone?.();
    }, [sendMailOnboardingTelemetry]);

    // Specific for Telemetry
    useEffect(() => {
        if (loadingTelemetryDeps) {
            return;
        }

        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.start_onboarding_modals, {});
    }, [loadingTelemetryDeps]);

    return (
        <NewMailOnboardingModalVariant
            {...props}
            onClose={endReplay}
            onDone={handleDone}
            data-testid="new-onboarding-variant"
        />
    );
};

export default MailOnboardingModal;
