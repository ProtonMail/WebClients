export enum OnboardingFlow {
    NONE = 0,
    B2B = 1,
    B2C = 2,
    FREE_PROMPT = 3,
}

export interface OnboardingInfo {
    onboardingFlow: OnboardingFlow;
    isUserEligible: boolean;
    flagValue: number;
}

export enum OnboardingStep {
    NONE = 0,
    INITIAL_MODAL = 1,
    MESSAGE = 2,
    CATEGORIZE = 3,
    CUSTOMIZE = 4,
    FREE_USERS_SPOTLIGHT = 5,
    DONE = 6,
}

// We highlight the second item in the list during the onboarding
export const HIGHLIGHTED_ITEM_INDEX = 1;

export type CategorizeStepLocation = 'list' | 'tab' | undefined;
