import { useEffect, useRef, useState } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import OnboardingDiscoverFeaturesStep from '@proton/components/components/onboarding/b2b/steps/OnboardingDiscoverFeaturesStep';
import OnboardingSetupOrgStep from '@proton/components/components/onboarding/b2b/steps/OnboardingSetupOrgStep';
import OnboardingTrialStep from '@proton/components/components/onboarding/b2b/steps/OnboardingTrialStep';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { useIsB2BTrial } from '@proton/payments/ui';
import { TelemetryB2BOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { useFlag } from '@proton/unleash';

import './B2BOnboardingModal.scss';

enum B2B_ONBOARDING_STEPS {
    LOADING = 'LOADING',
    TRIAL = 'TRIAL',
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
    const [subscription] = useSubscription();
    const [step, setStep] = useState<B2B_ONBOARDING_STEPS>(B2B_ONBOARDING_STEPS.LOADING);
    const orgSetupRef = useRef(false);
    const telemetrySentRef = useRef(false);
    const [forceModalSize, setForceModalSize] = useState(false);
    const { welcomeFlags, setDone: setWelcomeFlagsDone } = useWelcomeFlags();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const b2bOnboardingEnabled = useFlag('B2BOnboarding');

    const handleClose = () => {
        props?.onClose?.();

        // Set welcome flags so that the user does not see standard onboarding on next reload
        if (!welcomeFlags.isDone) {
            setWelcomeFlagsDone();
        }
    };

    const handleNextFromTrial = () => {
        // For now (as of 2025-06-19), if we have shown the trial onboarding step, and we're not in mail/calendar,
        // don't show any other steps and close the onboarding immediately
        const parentApp = getAppFromPathnameSafe(window.location.pathname);
        if (APP_NAME === APPS.PROTONACCOUNT && parentApp !== APPS.PROTONMAIL && parentApp !== APPS.PROTONCALENDAR) {
            handleClose();
            return;
        }

        // If the B2B onboarding is not enabled, only do the B2B trial onboarding
        if (!b2bOnboardingEnabled) {
            handleClose();
            return;
        }

        const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
        const nextStep = hasOrganizationKey ? B2B_ONBOARDING_STEPS.DISCOVER_FEATURES : B2B_ONBOARDING_STEPS.ORG_SETUP;
        setStep(nextStep);
    };

    // Show a loader while org is loading, then show the initial step that the user should actually see:
    // 1- Trial step if user is on B2B trial
    // 2- Org set up if not done yet
    // 3- B2B features list if org set up done
    useEffect(() => {
        // Update the initial state when org is loaded. Done once.
        if (!loadingOrganization && !orgSetupRef.current) {
            const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);

            const initialStep = (() => {
                // Show trial step first for B2B trial users
                if (isB2BTrial && props.source === 'onboarding') {
                    return B2B_ONBOARDING_STEPS.TRIAL;
                }
                // Then show org setup or features based on org state
                return hasOrganizationKey ? B2B_ONBOARDING_STEPS.DISCOVER_FEATURES : B2B_ONBOARDING_STEPS.ORG_SETUP;
            })();

            setStep(initialStep);
            orgSetupRef.current = true;
        }
    }, [organization, loadingOrganization, isB2BTrial, props.source]);

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
            {step === B2B_ONBOARDING_STEPS.TRIAL && !loadingOrganization && (
                <OnboardingTrialStep onNext={handleNextFromTrial} />
            )}
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
