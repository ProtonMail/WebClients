import type { ReactNode } from 'react';

/**
 * Self-contained constants and types for the temporary 0.99 promo.
 *
 * This offer is deliberately independent of the permanent one-dollar offer so it can be
 * deleted in one piece when the promo ends. Some values duplicate their one-dollar
 * equivalents by design: do not refactor them into a shared module.
 */

export const ZERO_NINETY_NINE_LAST_REMINDER_DAY = 29;
export const ZERO_NINETY_NINE_EXTENDED_REMINDER_DAY = 25;
export const ZERO_NINETY_NINE_DURATION = 30;
export const ZERO_NINETY_NINE_ACCOUNT_AGE_HOURS = 5;

/** Price in minor units for the main currencies (USD/EUR/CHF), where the coupon price is fixed. */
export const ZERO_NINETY_NINE_AMOUNT = 99;

export enum ZERO_NINETY_NINE_OFFER_STATE {
    notStarted = 0,
    firstSpotlight = 1,
    secondSpotlight = 2,
    lastReminder = 3,
}

export interface ZeroNinetyNineOfferState {
    offerStartDate: number;
    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE;
}

export interface ZeroNinetyNineFeature {
    id: string;
    title: ReactNode;
    free: ReactNode;
    plus: ReactNode;
}
