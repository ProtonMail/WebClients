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
}

export const FeatureValueDefault = -1 as const;
