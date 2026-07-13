export enum OnboardingFlow {
    NONE,
    B2B,
    B2C,
    FREE_PROMPT,
}

export interface OnboardingInfo {
    onboardingFlow: OnboardingFlow;
    isUserEligible: boolean;
    flagValue: number;
}

export enum OnboardingStep {
    NONE,
    INITIAL_MODAL,
    MESSAGE,
    CATEGORIZE,
    CUSTOMIZE,
    FREE_USERS_SPOTLIGHT,
    DONE,
}

// We highlight the second item in the list during the onboarding
export const HIGHLIGHTED_ITEM_INDEX = 1;

export type CategorizeStepLocation = 'list' | 'tab' | undefined;
