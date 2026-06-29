import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { AudienceType, CategoriesOnboardingFlags, FeatureValueDefault } from './onboardingInterface';

export const hasSeenOnboardingModal = (flagValue: number): boolean => {
    if (flagValue === FeatureValueDefault) {
        return true;
    }

    return hasBit(flagValue, CategoriesOnboardingFlags.INITIAL_MODAL);
};

export const hasSeenAllOnboarding = (audience: AudienceType, flagValue: number): boolean => {
    if (audience === AudienceType.B2C) {
        return hasSeenOnboardingModal(flagValue);
    }

    if (audience === AudienceType.B2B) {
        return hasSeenOnboardingModal(flagValue);
    }

    return false;
};
