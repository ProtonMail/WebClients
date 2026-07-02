import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { AudienceType, CategoriesOnboardingFlags, OnboardingStep } from './onboardingInterface';

/**
 * The B2C onboarding is a linear sequence: each step is unlocked only once the
 * previous one has been completed, and its bit is set when the user moves past
 * it. The whole progression is therefore described by this ordered table, and
 * the "active step" is simply the first step whose bit has not been set yet.
 */
const B2C_ONBOARDING_SEQUENCE: { step: OnboardingStep; flag: CategoriesOnboardingFlags }[] = [
    { step: OnboardingStep.INITIAL_MODAL, flag: CategoriesOnboardingFlags.INITIAL_MODAL },
    { step: OnboardingStep.MESSAGE, flag: CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE },
    { step: OnboardingStep.CATEGORIZE, flag: CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE },
    { step: OnboardingStep.CUSTOMIZE, flag: CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE },
];

export const hasSeenOnboardingModal = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.INITIAL_MODAL);
};

export const getB2COnboardingStep = (flagValue: number): OnboardingStep => {
    const nextStep = B2C_ONBOARDING_SEQUENCE.find(({ flag }) => !hasBit(flagValue, flag));
    return nextStep?.step ?? OnboardingStep.DONE;
};

export const hasSeenAllOnboarding = (audience: AudienceType, flagValue: number): boolean => {
    if (audience === AudienceType.B2C) {
        return B2C_ONBOARDING_SEQUENCE.every(({ flag }) => hasBit(flagValue, flag));
    }

    if (audience === AudienceType.B2B) {
        return hasSeenOnboardingModal(flagValue);
    }

    return false;
};
