import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { AudienceType, CategoriesOnboardingFlags, FeatureValueDefault } from './onboardingInterface';

export const hasSeeFullDisplay = (flagValue: number): boolean => {
    if (flagValue === FeatureValueDefault) {
        return true;
    }

    return hasBit(flagValue, CategoriesOnboardingFlags.FULL_DISPLAY);
};

export const hasSeenAllOnboarding = (audience: AudienceType, flagValue: number): boolean => {
    if (audience === AudienceType.B2C) {
        return hasSeeFullDisplay(flagValue);
    }

    if (audience === AudienceType.B2B) {
        return hasSeeFullDisplay(flagValue);
    }

    return false;
};
