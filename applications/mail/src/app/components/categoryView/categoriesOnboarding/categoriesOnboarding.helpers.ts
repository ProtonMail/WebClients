import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import {
    AudienceType,
    B2C_CATEGORIES_MAPPING,
    CategoriesOnboardingFlags,
    FeatureValueDefault,
} from './onboardingInterface';

export const hasSeeFullDisplay = (flagValue: number): boolean => {
    if (flagValue === FeatureValueDefault) {
        return true;
    }

    return hasBit(flagValue, CategoriesOnboardingFlags.FULL_DISPLAY);
};

export const hasSeeSocial = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.SOCIAL);
};

export const hasSeePromotion = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.PROMOTION);
};

export const hasSeeNewsletter = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.NEWSLETTER);
};

export const hasSeeTransaction = (flagValue: number): boolean => {
    return hasBit(flagValue, CategoriesOnboardingFlags.TRANSACTION);
};

export const hasSeenCategoryCard = (audience: AudienceType, labelID: string, flagValue: number): boolean => {
    if (flagValue === FeatureValueDefault) {
        return true;
    }

    if (audience === AudienceType.B2C) {
        const config = B2C_CATEGORIES_MAPPING[labelID];
        if (!config) {
            return false;
        }

        return config.checker(flagValue);
    }

    return false;
};

export const getOnboardingCardCopy = (audience: AudienceType, labelID: string) => {
    if (audience === AudienceType.B2C) {
        switch (labelID) {
            case MAILBOX_LABEL_IDS.CATEGORY_SOCIAL:
                return c('Info').t`Includes updates from social networks and media-sharing sites.`;
            case MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS:
                return c('Info').t`Includes marketing emails like offers and product announcements.`;
            case MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS:
                return c('Info').t`Includes news recaps and other non-promotional content. `;
            case MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS:
                return c('Info').t`Includes bills, receipts, orders, and bookings.`;
        }
    }
};

export const hasSeenAllOnboarding = (audience: AudienceType, flagValue: number): boolean => {
    if (audience === AudienceType.B2C) {
        return (
            hasSeeFullDisplay(flagValue) &&
            hasSeeSocial(flagValue) &&
            hasSeePromotion(flagValue) &&
            hasSeeNewsletter(flagValue) &&
            hasSeeTransaction(flagValue)
        );
    }

    return false;
};
