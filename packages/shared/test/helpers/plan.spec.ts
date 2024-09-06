import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import { isSamePlan } from '@proton/shared/lib/helpers/plan';

describe('isSamePlan', () => {
    it('should return true if the plans are the same', () => {
        const plan1: any = { Name: PLANS.MAIL, Cycle: CYCLE.MONTHLY };
        const plan2: any = { Name: PLANS.MAIL, Cycle: CYCLE.MONTHLY };
        expect(isSamePlan(plan1, plan2)).toBe(true);
    });

    it('should return false if the plans are different', () => {
        const plan1: any = { Name: PLANS.MAIL, Cycle: CYCLE.MONTHLY };
        const plan2: any = { Name: PLANS.VPN, Cycle: CYCLE.MONTHLY };
        expect(isSamePlan(plan1, plan2)).toBe(false);
    });

    it('should ignore difference in currencies', () => {
        const plan1: any = { Name: PLANS.MAIL, Cycle: CYCLE.MONTHLY, Currency: 'USD' };
        const plan2: any = { Name: PLANS.MAIL, Cycle: CYCLE.MONTHLY, Currency: 'EUR' };
        expect(isSamePlan(plan1, plan2)).toBe(true);
    });
});
