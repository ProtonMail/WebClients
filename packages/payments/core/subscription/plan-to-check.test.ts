import { CYCLE, PLANS } from '../constants';
import { getPlanToCheck } from './plan-to-check';

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
