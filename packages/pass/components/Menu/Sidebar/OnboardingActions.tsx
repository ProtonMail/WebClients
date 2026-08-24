import { memo } from 'react';

import { useOnboarding } from '../../Onboarding/OnboardingProvider';
import { OnboardingState } from '../../Onboarding/OnboardingState';
import { OnboardingType } from '../../Onboarding/Provider/OnboardingContext';
import { OnboardingButton } from '../B2B/OnboardingButton';

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
