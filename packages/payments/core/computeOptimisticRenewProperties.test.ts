import { getTestPlansMap } from '@proton/testing/data';

import { computeOptimisticRenewProperties } from './computeOptimisticRenewProperties';
import { CYCLE, PLANS } from './constants';

describe('computeOptimisticRenewProperties', () => {
    it('should return renew properties if users selects a plan with a variable cycle offer', () => {
        const currency = 'EUR';

        expect(
            computeOptimisticRenewProperties({
                planIDs: {
                    [PLANS.BUNDLE]: 1,
                },
                cycle: CYCLE.TWO_YEARS,
                currency,
                plansMap: getTestPlansMap(currency),
            })
        ).toEqual({
            BaseRenewAmount: 11988,
            RenewCycle: CYCLE.YEARLY,
        });
    });

    it('should return null if users selects a plan without a variable cycle offer', () => {
        const currency = 'EUR';

        expect(
            computeOptimisticRenewProperties({
                planIDs: {
                    [PLANS.BUNDLE]: 1,
                },
                cycle: CYCLE.YEARLY,
                currency,
                plansMap: getTestPlansMap(currency),
            })
        ).toEqual(null);
    });
});
