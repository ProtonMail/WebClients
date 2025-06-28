import { memo } from 'react';

import { OnboardingButton } from '@proton/pass/components/Menu/B2B/OnboardingButton';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { OnboardingState } from '@proton/pass/components/Onboarding/OnboardingState';
import { OnboardingType } from '@proton/pass/components/Onboarding/Provider/OnboardingContext';

export const OnboardingActions = memo(() => {
    const { enabled, type } = useOnboarding();

    if (!enabled) return null;

    return (
        <>
            {type === OnboardingType.B2B && <OnboardingButton />}
            {type === OnboardingType.WELCOME && <OnboardingState />}
            <hr className="my-2 mx-4" aria-hidden="true" />
        </>
    );
});

OnboardingActions.displayName = 'OnboardingActionsMemo';
