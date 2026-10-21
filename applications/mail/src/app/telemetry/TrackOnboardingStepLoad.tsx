import { useEffect } from 'react';

import type { ONBOARDING_STEPS } from './onboardingEvents';
import { useOnboardingTracking } from './onboardingEvents';

/**
 * Onboarding steps are called as functions by `OnboardingModal` (all of them, on every render), so their hooks run
 * even when the step is not displayed. Rendering this component inside the step makes the event fire only when the step is mounted.
 */
export const TrackOnboardingStepLoad = ({ step }: { step: ONBOARDING_STEPS }) => {
    const { trackStepLoaded } = useOnboardingTracking();

    useEffect(() => {
        trackStepLoaded(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the tracking functions are recreated on every render
    }, [step]);

    return null;
};
