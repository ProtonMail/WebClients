import { CYCLE, PLANS } from '@proton/payments';

import getAvailablePlansWithCycles from './getAvailablePlansWithCycles';

describe('getAvailablePlansWithCycles', () => {
    it('should return empty array when both plans and cycles are empty', () => {
        const result = getAvailablePlansWithCycles([], []);

        expect(result).toEqual([]);
    });

    it('should return empty array when plans are empty', () => {
        const cycles = [CYCLE.MONTHLY, CYCLE.YEARLY];
        const result = getAvailablePlansWithCycles([], cycles);

        expect(result).toEqual([]);
    });

    it('should return empty array when cycles are empty', () => {
        const plans = [{ planIDs: { [PLANS.BUNDLE]: 1 } }];
        const result = getAvailablePlansWithCycles(plans, []);

        expect(result).toEqual([]);
    });

    it('should create available plans for single plan and single cycle', () => {
        const plans = [{ planIDs: { [PLANS.BUNDLE]: 1 } }];
        const cycles = [CYCLE.MONTHLY];
        const result = getAvailablePlansWithCycles(plans, cycles);

        expect(result).toEqual([
            {
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: CYCLE.MONTHLY,
            },
        ]);
    });

    it('should create available plans for single plan and multiple cycles', () => {
        const plans = [{ planIDs: { [PLANS.BUNDLE]: 1 } }];
        const cycles = [CYCLE.MONTHLY, CYCLE.YEARLY];
        const result = getAvailablePlansWithCycles(plans, cycles);

        expect(result).toEqual([
            {
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: CYCLE.MONTHLY,
            },
            {
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: CYCLE.YEARLY,
            },
        ]);
    });

    it('should create available plans for multiple plans and single cycle', () => {
        const plans = [{ planIDs: { [PLANS.BUNDLE]: 1 } }, { planIDs: { [PLANS.FAMILY]: 1 } }];
        const cycles = [CYCLE.MONTHLY];
        const result = getAvailablePlansWithCycles(plans, cycles);

        expect(result).toEqual([
            {
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: CYCLE.MONTHLY,
            },
            {
                planIDs: { [PLANS.FAMILY]: 1 },
                cycle: CYCLE.MONTHLY,
            },
        ]);
    });

    it('should create available plans for multiple plans and multiple cycles', () => {
        const plans = [{ planIDs: { [PLANS.BUNDLE]: 1 } }, { planIDs: { [PLANS.FAMILY]: 1 } }];
        const cycles = [CYCLE.MONTHLY, CYCLE.YEARLY];
        const result = getAvailablePlansWithCycles(plans, cycles);

        expect(result).toEqual([
            {
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: CYCLE.MONTHLY,
            },
            {
                planIDs: { [PLANS.FAMILY]: 1 },
                cycle: CYCLE.MONTHLY,
            },
            {
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: CYCLE.YEARLY,
            },
            {
                planIDs: { [PLANS.FAMILY]: 1 },
                cycle: CYCLE.YEARLY,
            },
        ]);
    });

    it('should handle plans with multiple quantities', () => {
        const plans = [
            {
                planIDs: { [PLANS.BUNDLE]: 2, [PLANS.FAMILY]: 1 },
            },
        ];
        const cycles = [CYCLE.YEARLY];
        const result = getAvailablePlansWithCycles(plans, cycles);

        expect(result).toEqual([
            {
                planIDs: { [PLANS.BUNDLE]: 2, [PLANS.FAMILY]: 1 },
                cycle: CYCLE.YEARLY,
            },
        ]);
    });
});
