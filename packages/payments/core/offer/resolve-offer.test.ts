import type { Offer, Plan } from '@proton/shared/lib/payments/plan/interface';

import { getTestPlans } from '../../testing/data-plans';
import { CYCLE, PLANS } from '../constants';
import { resolveOffer, resolvePromotion } from './resolve-offer';

const whenEvaluate = new Date('2026-06-15T00:00:00Z');
const nowInSeconds = whenEvaluate.getTime() / 1000;

const summitDeal: Offer = {
    Name: 'SUMMITDEAL',
    StartTime: nowInSeconds - 1000,
    EndTime: nowInSeconds + 1000,
    Pricing: { [CYCLE.YEARLY]: 100 },
};

const getPlans = (offers: Offer[], overrides: Partial<Plan> = {}): Plan[] =>
    getTestPlans('USD').map((plan) =>
        plan.Name === PLANS.MAIL
            ? {
                  ...plan,
                  Pricing: { ...plan.Pricing, [CYCLE.YEARLY]: 4788 },
                  DefaultPricing: { ...plan.Pricing, [CYCLE.YEARLY]: 2079 },
                  Offers: offers,
                  ...overrides,
              }
            : plan
    );

const resolve = (overrides: Partial<Parameters<typeof resolveOffer>[0]> = {}) =>
    resolveOffer({
        plans: getPlans([summitDeal]),
        planName: PLANS.MAIL,
        cycle: CYCLE.YEARLY,
        currency: 'USD',
        offerName: 'SUMMITDEAL',
        whenEvaluate,
        ...overrides,
    });

describe('resolveOffer', () => {
    it('returns the offer price, the default price and the discount computed from the default price only', () => {
        expect(resolve()).toEqual({
            name: 'SUMMITDEAL',
            discountedAmount: 100,
            defaultAmount: 2079,
            discountPercent: 95,
            expired: false,
        });
    });

    it('matches the name case-insensitively', () => {
        expect(resolve({ offerName: 'summitDeal' })?.discountedAmount).toBe(100);
    });

    it('falls back to Pricing when DefaultPricing is missing', () => {
        const plans = getPlans([summitDeal], { DefaultPricing: undefined });

        expect(resolve({ plans })?.defaultAmount).toBe(4788);
        expect(resolve({ plans })?.discountPercent).toBe(98);
    });

    it('returns undefined when the name does not match', () => {
        expect(resolve({ offerName: 'OTHER' })).toBeUndefined();
    });

    it('returns undefined when the offer has no price for the cycle', () => {
        expect(resolve({ cycle: CYCLE.MONTHLY })).toBeUndefined();
    });

    it('returns undefined when the plan has no row for the currency', () => {
        expect(resolve({ currency: 'EUR', plans: getPlans([summitDeal]).filter((p) => p.Currency === 'USD') })).toBe(
            undefined
        );
        expect(resolve({ plans: [] })).toBeUndefined();
    });

    it('returns undefined when the plan is unknown', () => {
        expect(resolve({ planName: PLANS.DRIVE })).toBeUndefined();
    });

    it('marks an offer as expired when EndTime is reached', () => {
        const plans = getPlans([{ ...summitDeal, EndTime: nowInSeconds }]);

        expect(resolve({ plans })).toEqual({
            name: 'SUMMITDEAL',
            discountedAmount: 100,
            defaultAmount: 2079,
            discountPercent: 95,
            expired: true,
        });
    });

    it('marks an offer as expired when StartTime is in the future', () => {
        const plans = getPlans([{ ...summitDeal, StartTime: nowInSeconds + 1 }]);

        expect(resolve({ plans })?.expired).toBe(true);
    });

    it('is valid exactly at StartTime', () => {
        const plans = getPlans([{ ...summitDeal, StartTime: nowInSeconds }]);

        expect(resolve({ plans })?.expired).toBe(false);
    });
});

describe('resolvePromotion', () => {
    const offer = resolve();

    it('prefers a resolvable offer over a coupon', () => {
        expect(resolvePromotion({ offer, coupon: 'SOMECOUPON' })).toEqual({ kind: 'offer', offer });
    });

    it('keeps an expired offer over a coupon', () => {
        const expired = resolve({ plans: getPlans([{ ...summitDeal, EndTime: nowInSeconds }]) });

        expect(resolvePromotion({ offer: expired, coupon: 'SOMECOUPON' })).toEqual({
            kind: 'offer',
            offer: expired,
        });
    });

    it('uses the original coupon when the offer is unresolvable', () => {
        expect(resolvePromotion({ offer: undefined, coupon: 'Some-Coupon' })).toEqual({
            kind: 'coupon',
            coupon: 'Some-Coupon',
        });
    });

    it('uses the coupon when there is no offer', () => {
        expect(resolvePromotion({ coupon: 'SOMECOUPON' })).toEqual({ kind: 'coupon', coupon: 'SOMECOUPON' });
    });

    it('returns none without offer and coupon', () => {
        expect(resolvePromotion({ offer: undefined, coupon: undefined })).toEqual({ kind: 'none' });
    });
});
