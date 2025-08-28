import { CYCLE, PLANS } from './constants';
import { getRenewCycle } from './renewals';

describe('getRenewCycle', () => {
    it.each([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS])(
        'should return the selected cycle when no plan name is found: %s',
        (cycle) => {
            const result = getRenewCycle({}, cycle);
            expect(result).toBe(cycle);
        }
    );

    it.each([PLANS.MAIL, PLANS.VPN2024, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY])(
        'should return YEARLY cycle for %s plan with TWO_YEARS cycle',
        (plan) => {
            const result = getRenewCycle(plan, CYCLE.TWO_YEARS);
            expect(result).toBe(CYCLE.YEARLY);
        }
    );

    it.each([PLANS.FREE, PLANS.DRIVE, PLANS.DRIVE_PRO, PLANS.PASS])(
        'should keep TWO_YEARS cycle for %s plan',
        (plan) => {
            const result = getRenewCycle(plan, CYCLE.TWO_YEARS);
            expect(result).toBe(CYCLE.TWO_YEARS);
        }
    );

    it('should handle plan as PlanIDs object', () => {
        // Mock PlanIDs object that will be converted to PLANS.MAIL by getPlanNameFromIDs
        const planIDs = {
            mail2022: 1,
        };

        const result = getRenewCycle(planIDs, CYCLE.TWO_YEARS);
        expect(result).toBe(CYCLE.YEARLY);
    });
});
