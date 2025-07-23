import { type ReactNode } from 'react';

export const LAST_REMINDER_DAY = 29;
export const EXTENDED_REMINDER_DAY = 25;

export const POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE = 3;
export const POST_SIGNUP_ONE_DOLLAR_DURATION = 30;

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';

export enum AUTOMATIC_OFFER_STATE {
    'notStarted' = 0,
    'firstSpotlight' = 1,
    'secondSpotlight' = 2,
    'lastReminder' = 3,
}

export interface PostSubscriptionOneDollarOfferState {
    offerStartDate: number;
    automaticOfferReminders: AUTOMATIC_OFFER_STATE;
}

export interface FeatureProps {
    id: string;
    title: ReactNode;
    free: ReactNode;
    plus: ReactNode;
}
