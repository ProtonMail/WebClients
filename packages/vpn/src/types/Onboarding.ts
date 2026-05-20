export const ONBOARDING = {
    NotEligible: 'not-eligible',
    NotOnboarded: 'not-onboarded',
    Onboarded: 'onboarded',
    Dismissed: 'dismissed',
} as const;

export type Onboarding = (typeof ONBOARDING)[keyof typeof ONBOARDING];
