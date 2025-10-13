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

export enum CategoriesOnboardingFlags {
    FULL_DISPLAY = 1 << 0,
    SOCIAL = 1 << 1,
    PROMOTION = 1 << 2,
    NEWSLETTER = 1 << 3,
    TRANSACTION = 1 << 4,
    UPDATE = 1 << 5,
    FORUMS = 1 << 6,
}

export const FeatureValueDefault = -1 as const;

export const B2COnboardinCategoriesWithCards = new Set<string>([
    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
    MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
]);

export const B2BOnboardinCategoriesWithCards = new Set<string>([
    MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
]);

interface CategoryConfig {
    flag: CategoriesOnboardingFlags;
    checker: (flagValue: number) => boolean;
}

export const B2C_CATEGORIES_MAPPING: Record<string, CategoryConfig> = {
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: {
        flag: CategoriesOnboardingFlags.SOCIAL,
        checker: (flagValue: number) => hasBit(flagValue, CategoriesOnboardingFlags.SOCIAL),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: {
        flag: CategoriesOnboardingFlags.PROMOTION,
        checker: (flagValue: number) => hasBit(flagValue, CategoriesOnboardingFlags.PROMOTION),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: {
        flag: CategoriesOnboardingFlags.NEWSLETTER,
        checker: (flagValue: number) => hasBit(flagValue, CategoriesOnboardingFlags.NEWSLETTER),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: {
        flag: CategoriesOnboardingFlags.TRANSACTION,
        checker: (flagValue: number) => hasBit(flagValue, CategoriesOnboardingFlags.TRANSACTION),
    },
} as const;

export const B2B_CATEGORIES_MAPPING: Record<string, CategoryConfig> = {
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: {
        flag: CategoriesOnboardingFlags.TRANSACTION,
        checker: (flagValue: number) => hasBit(flagValue, CategoriesOnboardingFlags.TRANSACTION),
    },
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: {
        flag: CategoriesOnboardingFlags.UPDATE,
        checker: (flagValue: number) => hasBit(flagValue, CategoriesOnboardingFlags.UPDATE),
    },
} as const;
