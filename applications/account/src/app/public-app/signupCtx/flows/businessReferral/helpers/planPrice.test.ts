import type { PaymentsContextOptimisticType } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import type { Plan, PlansMap } from '@proton/shared/lib/payments/plan/interface';

import { getPlanCardPrices } from './planPrice';

const buildPlan = (Name: string, Type: PLAN_TYPES, Pricing: Plan['Pricing'], MaxMembers: number) =>
    ({ ID: Name, Name, Title: Name, Type, Pricing, MaxMembers, Currency: 'EUR' }) as unknown as Plan;

const plansMap = {
    [PLANS.BUNDLE_BIZ_2025]: buildPlan(PLANS.BUNDLE_BIZ_2025, PLAN_TYPES.PLAN, { 1: 2499, 12: 23988 }, 1),
    [PLANS.VPN_BUSINESS]: buildPlan(PLANS.VPN_BUSINESS, PLAN_TYPES.PLAN, { 1: 7397, 12: 71964 }, 2),
    [ADDON_NAMES.IP_VPN_BUSINESS]: buildPlan(ADDON_NAMES.IP_VPN_BUSINESS, PLAN_TYPES.ADDON, { 1: 4999, 12: 47988 }, 0),
} as PlansMap;

const buildCheckResult = (overrides: Partial<SubscriptionEstimation>) =>
    ({
        Amount: 0,
        AmountDue: 0,
        CouponDiscount: 0,
        Coupon: null,
        Currency: 'EUR',
        Cycle: CYCLE.YEARLY,
        PeriodEnd: 0,
        SubscriptionMode: 0,
        BaseRenewAmount: null,
        RenewCycle: null,
        requestData: {},
        ...overrides,
    }) as SubscriptionEstimation;

const buildPayments = (checkResult: SubscriptionEstimation) => {
    const getPriceOrFallback = jest.fn((planToCheck: PlanToCheck) => ({
        checkResult,
        checkoutUi: getCheckoutUi({ planIDs: planToCheck.planIDs, plansMap, checkResult }),
    }));
    const payments = {
        options: { cycle: CYCLE.YEARLY, currency: 'EUR' },
        plansMap,
        getCoupon: () => 'BUSINESSREFERRAL2026',
        getPriceOrFallback,
    } as unknown as PaymentsContextOptimisticType;
    return { payments, getPriceOrFallback };
};

describe('getPlanCardPrices', () => {
    it('shows the check result prices for a single-user plan', () => {
        const { payments } = buildPayments(buildCheckResult({ Amount: 23988, CouponDiscount: -2399 }));

        expect(getPlanCardPrices(payments, PLANS.BUNDLE_BIZ_2025)).toEqual({
            currency: 'EUR',
            regularPricePerMonth: 2499,
            pricePerMonth: (23988 - 2399) / 12,
            renewalPricePerMonth: 1999,
        });
    });

    it('takes the single-user renewal price from the check result when the backend overrides it', () => {
        const { payments } = buildPayments(buildCheckResult({ Amount: 23988, BaseRenewAmount: 26388 }));

        expect(getPlanCardPrices(payments, PLANS.BUNDLE_BIZ_2025).renewalPricePerMonth).toBe(2199);
    });

    it('shows VPN Professional prices per included member, without the included server', () => {
        const { payments, getPriceOrFallback } = buildPayments(buildCheckResult({ Amount: 71964 }));

        expect(getPlanCardPrices(payments, PLANS.VPN_BUSINESS)).toEqual({
            currency: 'EUR',
            regularPricePerMonth: 1199,
            pricePerMonth: 999,
            renewalPricePerMonth: 999,
        });
        expect(getPriceOrFallback).toHaveBeenCalledWith({
            planIDs: { [PLANS.VPN_BUSINESS]: 1 },
            cycle: CYCLE.YEARLY,
            currency: 'EUR',
            coupon: 'BUSINESSREFERRAL2026',
            trial: false,
        });
    });

    it('splits the whole VPN Professional coupon discount over the included members', () => {
        const { payments } = buildPayments(buildCheckResult({ Amount: 71964, CouponDiscount: -7196 }));

        expect(getPlanCardPrices(payments, PLANS.VPN_BUSINESS)).toEqual({
            currency: 'EUR',
            regularPricePerMonth: 1199,
            pricePerMonth: 999 - 7196 / 12 / 2,
            renewalPricePerMonth: 999,
        });
    });
});
