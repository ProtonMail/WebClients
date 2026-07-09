export enum CategoriesOnboardingFlags {
    INITIAL_MODAL = 1 << 0,
    SPOTLIGHT_MESSAGE = 1 << 1,
    SPOTLIGHT_CATEGORIZE = 1 << 2,
    SPOTLIGHT_CUSTOMIZE = 1 << 3,
    SPOTLIGHT_FREE_USERS = 1 << 4,
}

// Default flag value for a user who has not started the onboarding yet: no bit set.
export const FeatureValueDefault = 0 as const;

// Every onboarding bit set. Flipping all of them opts the user out of the whole flow.
const ALL_ONBOARDING_FLAGS =
    CategoriesOnboardingFlags.INITIAL_MODAL |
    CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE |
    CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE |
    CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE |
    CategoriesOnboardingFlags.SPOTLIGHT_FREE_USERS;

export const isOnboardingComplete = (flagValue: number): boolean => {
    return (flagValue & ALL_ONBOARDING_FLAGS) === ALL_ONBOARDING_FLAGS;
};

export const getCompletedOnboardingFlag = (flagValue: number): number => {
    return flagValue | ALL_ONBOARDING_FLAGS;
};
