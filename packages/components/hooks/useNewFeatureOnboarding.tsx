import { useState } from 'react';

import { isAfter, isBefore } from 'date-fns';

import { useWelcomeFlags } from '@proton/components/hooks/useWelcomeFlags';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

type Props = {
    key: string;
    featureFlagsEnabled?: boolean;
    shouldWelcomeFlowBeDone?: boolean;
    startDate?: string;
    expirationDate?: string;
};

const getIsActive = (startDate?: string, expirationDate?: string) => {
    const today = new Date();

    if (startDate && isBefore(today, new Date(startDate))) {
        return false;
    }

    if (expirationDate && isAfter(today, new Date(expirationDate))) {
        return false;
    }

    return true;
};

export default function useNewFeatureOnboarding({
    key,
    featureFlagsEnabled = true,
    shouldWelcomeFlowBeDone = true,
    startDate,
    expirationDate,
}: Props) {
    const onboardingKey = `onboarding-${key}`;
    const [wasShown, setWasShown] = useState<boolean>(Boolean(getItem(onboardingKey, 'false')));
    const [welcomeFlags] = useWelcomeFlags();

    const isActive = getIsActive(startDate, expirationDate);
    const isWelcomeDone = shouldWelcomeFlowBeDone && welcomeFlags.isDone;
    const showOnboarding = !wasShown && isActive && featureFlagsEnabled && isWelcomeDone;

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
