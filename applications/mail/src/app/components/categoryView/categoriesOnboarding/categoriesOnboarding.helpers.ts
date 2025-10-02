import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { B2COnboardingFlags, B2C_CATEGORIES_MAPPING, FeatureValueDefault } from './onboardingInterface';

export const hasSeeFullDisplay = (flagValue: number): boolean => {
    if (flagValue === FeatureValueDefault) {
        return true;
    }

    return hasBit(flagValue, B2COnboardingFlags.FULL_DISPLAY);
};

export const hasSeeSocial = (flagValue: number): boolean => {
    return hasBit(flagValue, B2COnboardingFlags.SOCIAL);
};

export const hasSeePromotion = (flagValue: number): boolean => {
    return hasBit(flagValue, B2COnboardingFlags.PROMOTION);
};

export const hasSeeNewsletter = (flagValue: number): boolean => {
    return hasBit(flagValue, B2COnboardingFlags.NEWSLETTER);
};

export const hasSeeTransaction = (flagValue: number): boolean => {
    return hasBit(flagValue, B2COnboardingFlags.TRANSACTION);
};

export const hasSeenCategoryCard = (labelID: string, flagValue: number): boolean => {
    if (flagValue === FeatureValueDefault) {
        return true;
    }

    const config = B2C_CATEGORIES_MAPPING[labelID];
    if (!config) {
        return false;
    }

    return config.checker(flagValue);
};

export const getB2CCardCopy = (labelID: string) => {
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
};

export const hasSeenAllOnboarding = (flagValue: number): boolean => {
    return (
        hasSeeFullDisplay(flagValue) &&
        hasSeeSocial(flagValue) &&
        hasSeePromotion(flagValue) &&
        hasSeeNewsletter(flagValue) &&
        hasSeeTransaction(flagValue)
    );
};
