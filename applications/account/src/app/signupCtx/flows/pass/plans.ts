import type { Currency, PlanIDs } from '@proton/payments';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';

export const passPlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.PASS]: 1 },
};

export const unlimited: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.BUNDLE]: 1 },
};

export const family: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.FAMILY]: 1 },
};

export const passLifetime: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.PASS_LIFETIME]: 1 },
};

export const getPassPlusOfferPlan = (currency: Currency) => ({
    planIDs: passPlus.planIDs,
    cycle: CYCLE.MONTHLY,
    currency,
    coupon: COUPON_CODES.PASSPLUSINTRO2024,
});
