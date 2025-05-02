import { useEffect, useRef, useState } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import OnboardingDiscoverFeaturesStep from '@proton/components/components/onboarding/b2b/steps/OnboardingDiscoverFeaturesStep';
import OnboardingSetupOrgStep from '@proton/components/components/onboarding/b2b/steps/OnboardingSetupOrgStep';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { TelemetryB2BOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';

import './B2BOnboardingModal.scss';

enum B2B_ONBOARDING_STEPS {
    LOADING = 'LOADING',
    ORG_SETUP = 'ORG_SETUP',
    DISCOVER_FEATURES = 'DISCOVER_FEATURES',
}

interface Props {
    onClose?: () => void;
    onExit?: () => void;
    open?: boolean;
    source?: 'navbar-button' | 'onboarding' | 'post-subscription';
}

const B2BOnboardingModal = (props: Props) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const [organization, loadingOrganization] = useOrganization();
    const [step, setStep] = useState<B2B_ONBOARDING_STEPS>(B2B_ONBOARDING_STEPS.LOADING);
    const orgSetupRef = useRef(false);
    const telemetrySentRef = useRef(false);
    const [forceModalSize, setForceModalSize] = useState(false);
    const { welcomeFlags, setDone: setWelcomeFlagsDone } = useWelcomeFlags();

    const handleClose = () => {
        props?.onClose?.();

        // Set welcome flags so that the user does not see standard onboarding on next reload
        if (!welcomeFlags.isDone) {
            setWelcomeFlagsDone();
        }
    };

    // Show a loader while org is loading, then show the initial step that the user should actually see:
    // 1- Org set up if not done yet
    // 2- B2B features list if org set up done
    useEffect(() => {
        // Update the initial state when org is loaded. Done once.
        if (!loadingOrganization && !orgSetupRef.current) {
            const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);

            const initialStep = hasOrganizationKey
                ? B2B_ONBOARDING_STEPS.DISCOVER_FEATURES
                : B2B_ONBOARDING_STEPS.ORG_SETUP;
            setStep(initialStep);
            orgSetupRef.current = true;
        }
    }, [organization, loadingOrganization]);

    useEffect(() => {
        if (!telemetrySentRef.current) {
            telemetrySentRef.current = true;

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.b2bOnboarding,
                event: TelemetryB2BOnboardingEvents.modal_displayed,
                dimensions: {
                    app: APP_NAME,
                    source: props.source,
                },
                delay: false,
            });
        }
    }, []);

    return (
        <ModalTwo
            {...props}
            onClose={handleClose}
            size={step === B2B_ONBOARDING_STEPS.DISCOVER_FEATURES || forceModalSize ? 'xlarge' : 'medium'}
            className="b2b-onboarding-modal"
        >
            {step === B2B_ONBOARDING_STEPS.LOADING && <Loader />}
            {step === B2B_ONBOARDING_STEPS.ORG_SETUP && !loadingOrganization && (
                <OnboardingSetupOrgStep
                    onNextStep={() => setStep(B2B_ONBOARDING_STEPS.DISCOVER_FEATURES)}
                    onChangeModalSize={(val: boolean) => setForceModalSize(val)}
                />
            )}
            {step === B2B_ONBOARDING_STEPS.DISCOVER_FEATURES && !loadingOrganization && (
                <OnboardingDiscoverFeaturesStep onClose={handleClose} />
            )}
        </ModalTwo>
    );
};

export default B2BOnboardingModal;
