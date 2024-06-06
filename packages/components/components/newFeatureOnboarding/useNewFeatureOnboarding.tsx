import { useState } from 'react';

import { useWelcomeFlags } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

type Props = {
    key: string;
    featureFlagsEnabled?: boolean;
    shouldWelcomeFlowBeDone?: boolean;
};
export default function useNewFeatureOnboarding({
    key,
    featureFlagsEnabled = true,
    shouldWelcomeFlowBeDone = true,
}: Props) {
    const onboardingKey = `onboarding-${key}`;
    const [wasShown, setWasShown] = useState<boolean>(Boolean(getItem(onboardingKey, 'false')));
    const [welcomeFlags] = useWelcomeFlags();

    const showOnboarding =
        !wasShown && featureFlagsEnabled && (!shouldWelcomeFlowBeDone || !welcomeFlags.isWelcomeFlow);

    const onWasShown = () => {
        if (!wasShown) {
            setItem(onboardingKey, 'true');
            setWasShown(true);
        }
    };

    return {
        showOnboarding,
        onWasShown,
    };
}
