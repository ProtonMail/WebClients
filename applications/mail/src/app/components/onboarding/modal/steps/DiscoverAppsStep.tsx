import OnboardingDiscoverApps from '@proton/components/containers/onboarding/OnboardingDiscoverApps';
import type { OnboardingStepRenderCallback } from '@proton/components/containers/onboarding/interface';

import { TrackOnboardingStepLoad } from '../../../../telemetry/TrackOnboardingStepLoad';
import { ONBOARDING_ACTIONS, ONBOARDING_STEPS, useOnboardingTracking } from '../../../../telemetry/onboardingEvents';

export const DiscoverAppsStep = ({ onNext, onBack }: OnboardingStepRenderCallback) => {
    const { trackStepInteracted, trackStepCompleted } = useOnboardingTracking();

    const handleNext = () => {
        trackStepCompleted(ONBOARDING_STEPS.discoverApps);
        onNext();
    };

    const handleBack = () => {
        trackStepInteracted(ONBOARDING_STEPS.discoverApps, ONBOARDING_ACTIONS.back);
        onBack?.();
    };

    return (
        <>
            <TrackOnboardingStepLoad step={ONBOARDING_STEPS.discoverApps} />
            <OnboardingDiscoverApps onNext={handleNext} onBack={handleBack} />
        </>
    );
};
