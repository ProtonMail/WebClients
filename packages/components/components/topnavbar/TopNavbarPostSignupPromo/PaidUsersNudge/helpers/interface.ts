import type { PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';

export type SupportedPlans = PLANS.MAIL | PLANS.DRIVE | PLANS.BUNDLE;

export const OfferDuration = 7 as const;
export const ReminderMaxHours = 24 as const;
export const HIDE_OFFER = -1 as const;

export const ReminderDates: Record<string, number> = {
    day10: 10,
    day40: 40,
} as const;

export interface PriceData {
    yearlyPrice: number;
    discountedPrice: number;
    savedAmount: number;
    currency: Currency;
}
