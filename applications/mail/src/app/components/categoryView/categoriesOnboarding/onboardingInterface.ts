import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

export enum AudienceType {
    B2B = 'b2b',
    B2C = 'b2c',
}

export interface OnboardingInfo {
    audienceType?: AudienceType;
    isUserEligible: boolean;
    flagValue: number;
}

export enum B2COnboardingFlags {
    FULL_DISPLAY = 1 << 0,
    SOCIAL = 1 << 1,
    PROMOTION = 1 << 2,
    NEWSLETTER = 1 << 3,
    TRANSACTION = 1 << 4,
}

export const FeatureValueDefault = -1 as const;

export const B2COnboardinCategoriesWithCards = new Set<string>([
    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
    MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
]);

interface CategoryConfig {
    flag: B2COnboardingFlags;
    checker: (flagValue: number) => boolean;
}

export const B2C_CATEGORIES_MAPPING: Record<string, CategoryConfig> = {
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: {
        flag: B2COnboardingFlags.SOCIAL,
        checker: (flagValue: number) => hasBit(flagValue, B2COnboardingFlags.SOCIAL),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: {
        flag: B2COnboardingFlags.PROMOTION,
        checker: (flagValue: number) => hasBit(flagValue, B2COnboardingFlags.PROMOTION),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: {
        flag: B2COnboardingFlags.NEWSLETTER,
        checker: (flagValue: number) => hasBit(flagValue, B2COnboardingFlags.NEWSLETTER),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: {
        flag: B2COnboardingFlags.TRANSACTION,
        checker: (flagValue: number) => hasBit(flagValue, B2COnboardingFlags.TRANSACTION),
    },
} as const;
