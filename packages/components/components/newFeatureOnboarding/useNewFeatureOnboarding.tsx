import { useState } from 'react';

import { useWelcomeFlags } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

type Props = {
    key: string;
    featureFlagsEnabled?: boolean;
    shouldWelcomeFlowBeDone?: boolean;
    expirationDate?: string;
};

const getIsExpired = (expirationDate?: string) => {
    if (!expirationDate) {
        return false;
    }
    const expirationTimestamp = new Date(expirationDate).getTime();
    const currentTimestamp = new Date().getTime();
    return expirationTimestamp < currentTimestamp;
};

export default function useNewFeatureOnboarding({
    key,
    featureFlagsEnabled = true,
    shouldWelcomeFlowBeDone = true,
    expirationDate,
}: Props) {
    const onboardingKey = `onboarding-${key}`;
    const [wasShown, setWasShown] = useState<boolean>(Boolean(getItem(onboardingKey, 'false')));
    const [welcomeFlags] = useWelcomeFlags();

    const isExpired = getIsExpired(expirationDate);
    const showOnboarding =
        !wasShown && !isExpired && featureFlagsEnabled && (!shouldWelcomeFlowBeDone || !welcomeFlags.isWelcomeFlow);

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
