import { CategoriesOnboardingFlags } from '@proton/mail/features/categoriesView/categoriesOnboarding';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import type { CategorizeStepLocation } from './onboardingInterface';
import { OnboardingFlow, OnboardingStep } from './onboardingInterface';

/**
 * The B2C onboarding is a linear sequence: each step is unlocked only once the
 * previous one has been completed, and its bit is set when the user moves past
 * it. The whole progression is therefore described by this ordered table, and
 * the "active step" is simply the first step whose bit has not been set yet.
 */
export const B2C_ONBOARDING_SEQUENCE: { step: OnboardingStep; flag: CategoriesOnboardingFlags }[] = [
    { step: OnboardingStep.INITIAL_MODAL, flag: CategoriesOnboardingFlags.INITIAL_MODAL },
    { step: OnboardingStep.CATEGORIZE, flag: CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE },
    { step: OnboardingStep.CUSTOMIZE, flag: CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE },
    { step: OnboardingStep.MESSAGE, flag: CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE },
];

export const hasSeenOnboardingModal = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.INITIAL_MODAL);
};

export const getB2COnboardingStep = (flagValue: number): OnboardingStep => {
    const nextStep = B2C_ONBOARDING_SEQUENCE.find(({ flag }) => !hasBit(flagValue, flag));
    return nextStep?.step ?? OnboardingStep.DONE;
};

export const hasSeenAllOnboarding = (onboardingFlow: OnboardingFlow, flagValue: number): boolean => {
    if (onboardingFlow === OnboardingFlow.B2C) {
        return B2C_ONBOARDING_SEQUENCE.every(({ flag }) => hasBit(flagValue, flag));
    }

    if (onboardingFlow === OnboardingFlow.B2B) {
        return hasSeenOnboardingModal(flagValue);
    }

    return false;
};

export const hasSeenFreeUserSpotlight = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.SPOTLIGHT_FREE_USERS);
};

export const getSocialTabSpotlightStep = (
    activeStep: OnboardingStep,
    categorizeStepLocation: CategorizeStepLocation
): OnboardingStep | undefined => {
    if (activeStep === OnboardingStep.MESSAGE || activeStep === OnboardingStep.FREE_USERS_SPOTLIGHT) {
        return activeStep;
    }

    if (activeStep === OnboardingStep.CATEGORIZE && categorizeStepLocation === 'tab') {
        return OnboardingStep.CATEGORIZE;
    }

    return undefined;
};

export const getListSpotlightStep = (
    activeStep: OnboardingStep,
    categorizeStepLocation: CategorizeStepLocation
): OnboardingStep | undefined => {
    return activeStep === OnboardingStep.CATEGORIZE && categorizeStepLocation === 'list'
        ? OnboardingStep.CATEGORIZE
        : undefined;
};
