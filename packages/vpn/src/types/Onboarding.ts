export const ONBOARDING_STEPS = {
    NotEligible: 'not-eligible',
    NotOnboarded: 'not-onboarded',
    Onboarded: 'onboarded',
    Dismissed: 'dismissed',
} as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];
