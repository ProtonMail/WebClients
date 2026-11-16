import { PLANS } from '../constants';
import type { Currency } from '../interface';

export type LumoApiPlan = PLANS.LUMO_ULTRA | PLANS.LUMO_BUSINESS | PLANS.BUNDLE_BIZ_2025 | PLANS.VISIONARY;

export const LUMO_API_CREDIT_CURRENCY: Currency = 'USD';

export interface LumoMonthlyApiCredit {
    amountInCents: number;
    perUser: boolean;
}

export const LUMO_MONTHLY_API_CREDIT: Record<LumoApiPlan, LumoMonthlyApiCredit> = {
    [PLANS.LUMO_ULTRA]: { amountInCents: 5000, perUser: false },
    [PLANS.LUMO_BUSINESS]: { amountInCents: 500, perUser: true },
    [PLANS.BUNDLE_BIZ_2025]: { amountInCents: 500, perUser: true },
    [PLANS.VISIONARY]: { amountInCents: 2500, perUser: false },
};
