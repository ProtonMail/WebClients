import { DEFAULT_TAX_BILLING_ADDRESS } from '../billing-address/billing-address';
import { CYCLE, PLANS } from '../constants';
import { getPlanToCheck, getSubscriptionDataFromPlanToCheck } from './plan-to-check';

describe('getPlanToCheck', () => {
    it('returns the same params when no auto coupon applies', () => {
        const params = {
            planIDs: { [PLANS.MAIL]: 1 },
            cycle: CYCLE.MONTHLY,
            currency: 'USD' as const,
            coupon: 'CUSTOM',
        };

        expect(getPlanToCheck(params)).toEqual(params);
    });

    it('applies auto coupon for eligible VPN yearly plans', () => {
        const result = getPlanToCheck({
            planIDs: { [PLANS.VPN2024]: 1 },
            cycle: CYCLE.YEARLY,
            currency: 'USD',
        });

        expect(result.coupon).toBeDefined();
        expect(result.planIDs).toEqual({ [PLANS.VPN2024]: 1 });
    });
});

describe('getPlanToCheck with an offer', () => {
    it('does not inject an auto coupon while an offer is active', () => {
        const result = getPlanToCheck({
            planIDs: { [PLANS.VPN2024]: 1 },
            cycle: CYCLE.YEARLY,
            currency: 'USD',
            offer: 'SPRING',
        });

        expect(result.coupon).toBeUndefined();
        expect(result.offer).toBe('SPRING');
    });
});

describe('getSubscriptionDataFromPlanToCheck', () => {
    const base = {
        planIDs: { [PLANS.MAIL]: 1 },
        cycle: CYCLE.YEARLY,
        currency: 'USD' as const,
        VatId: undefined,
        BillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
    };

    it('sends the offer and no codes for an offer-only check', () => {
        const data = getSubscriptionDataFromPlanToCheck({ ...base, offer: 'SPRING' });

        expect(data.Offer).toBe('SPRING');
        expect(data.Codes).toEqual([]);
    });

    it('drops the coupon when an offer is present, because offers and coupons do not stack', () => {
        const data = getSubscriptionDataFromPlanToCheck({ ...base, offer: 'SPRING', coupon: 'COUPON' });

        expect(data.Offer).toBe('SPRING');
        expect(data.Codes).toEqual([]);
    });

    it('treats a blank offer as no offer', () => {
        const data = getSubscriptionDataFromPlanToCheck({ ...base, offer: '  ', coupon: 'COUPON' });

        expect(data).not.toHaveProperty('Offer');
        expect(data.Codes).toEqual(['COUPON']);
    });

    it('keeps the coupon-only payload unchanged', () => {
        const data = getSubscriptionDataFromPlanToCheck({ ...base, coupon: 'COUPON' });

        expect(Object.keys(data)).toEqual([
            'Plans',
            'Currency',
            'Cycle',
            'Codes',
            'BillingAddress',
            'ValidateBillingAddress',
            'IsTrial',
            'VatId',
        ]);
        expect(data.Codes).toEqual(['COUPON']);
    });
});
