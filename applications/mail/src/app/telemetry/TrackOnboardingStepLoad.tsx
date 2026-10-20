import { useEffect } from 'react';

import type { ONBOARDING_STEPS } from './onboardingEvents';
import { trackStepLoaded } from './onboardingEvents';

/**
 * Onboarding steps are called as functions by `OnboardingModal` (all of them, on every render), so their hooks run
 * even when the step is not displayed. Rendering this component inside the step makes the event fire only when the step is mounted.
 */
export const TrackOnboardingStepLoad = ({ step }: { step: ONBOARDING_STEPS }) => {
    useEffect(() => {
        trackStepLoaded(step);
    }, [step]);

    return null;
};
