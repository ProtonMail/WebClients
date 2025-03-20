export const OfferDuration = 7 as const;
export const ReminderMaxHours = 24 as const;
export const HIDE_OFFER = -1 as const;

export const ReminderDates: Record<string, number> = {
    day20: 20,
    day50: 50,
    day80: 80,
    day110: 110,
    day140: 140,
    day170: 170,
} as const;

export interface PriceData {
    yearlyPrice: number;
    discountedPrice: number;
    savedAmount: number;
    savedPercentage: number;
}
