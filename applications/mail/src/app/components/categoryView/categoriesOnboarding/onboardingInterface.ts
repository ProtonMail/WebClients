export enum AudienceType {
    B2B = 'b2b',
    B2C = 'b2c',
}

export interface OnboardingInfo {
    audienceType?: AudienceType;
    isUserEligible: boolean;
    flagValue: number;
}

export enum CategoriesOnboardingFlags {
    INITIAL_MODAL = 1 << 0,
    SPOTLIGHT_MESSAGE = 1 << 1,
    SPOTLIGHT_CATEGORIZE = 1 << 2,
    SPOTLIGHT_CUSTOMIZE = 1 << 3,
    SPOTLIGHT_FREE_USERS = 1 << 4,
}

export const FeatureValueDefault = -1 as const;

export enum OnboardingStep {
    NONE,
    MESSAGE,
    CATEGORIZE,
    CUSTOMIZE,
    DONE,
}

// We highlight the second item in the list during the onboarding
export const HIGHLIGHTED_ITEM_INDEX = 1;

// Show a fake "3 unread messages" count during the onboarding
export const ONBOARDING_OVERRIDE_UNREAD_COUNT = 3;
