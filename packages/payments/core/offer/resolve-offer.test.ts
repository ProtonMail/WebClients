import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import { getTestPlans } from '../../testing/data-plans';
import { CYCLE, PLANS } from '../constants';
import { resolveOffer, resolvePromotion } from './resolve-offer';

const summitDeal = { Name: 'SUMMITDEAL', Description: 'Summit deal' };

const getPlans = (overrides: Partial<Plan> = {}): Plan[] =>
    getTestPlans('USD').map((plan) =>
        plan.Name === PLANS.MAIL
            ? {
                  ...plan,
                  Pricing: { ...plan.Pricing, [CYCLE.YEARLY]: 100 },
                  DefaultPricing: { ...plan.Pricing, [CYCLE.YEARLY]: 2079 },
                  Offers: { [CYCLE.YEARLY]: summitDeal },
                  ...overrides,
              }
            : plan
    );

const resolve = (overrides: Partial<Parameters<typeof resolveOffer>[0]> = {}) =>
    resolveOffer({
        plans: getPlans(),
        planName: PLANS.MAIL,
        cycle: CYCLE.YEARLY,
        currency: 'USD',
        offerName: 'SUMMITDEAL',
        ...overrides,
    });

describe('resolveOffer', () => {
    it('returns the offer price, the default price and the discount between them', () => {
        expect(resolve()).toEqual({
            name: 'SUMMITDEAL',
            discountedAmount: 100,
            defaultAmount: 2079,
            discountPercent: 95,
        });
    });

    it('matches the name case-insensitively', () => {
        expect(resolve({ offerName: 'summitDeal' })?.discountedAmount).toBe(100);
    });

    it('returns undefined when DefaultPricing is missing', () => {
        expect(resolve({ plans: getPlans({ DefaultPricing: undefined }) })).toBeUndefined();
    });

    it('returns undefined when the name does not match', () => {
        expect(resolve({ offerName: 'OTHER' })).toBeUndefined();
    });

    it('returns undefined when the offer does not cover the cycle', () => {
        expect(resolve({ cycle: CYCLE.MONTHLY })).toBeUndefined();
    });

    it('returns undefined when the plan has no row for the currency', () => {
        expect(resolve({ currency: 'EUR' })).toBeUndefined();
        expect(resolve({ plans: [] })).toBeUndefined();
    });

    it('returns undefined when the plan is unknown', () => {
        expect(resolve({ planName: PLANS.DRIVE })).toBeUndefined();
    });
});

describe('resolvePromotion', () => {
    const offer = resolve();

    it('prefers a resolvable offer over a coupon', () => {
        expect(resolvePromotion({ offer, coupon: 'SOMECOUPON' })).toEqual({ kind: 'offer', offer });
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
