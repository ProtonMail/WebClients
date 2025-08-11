import { PLANS, PLAN_TYPES } from '../constants';
import { type Cycle } from '../interface';
import { type Plan } from '../plan/interface';
import {
    getAvailableCycles,
    getPlanByName,
    getPlansMap,
    getStrictPlanByName,
    hasCycle,
    planExists,
    planToPlanIDs,
} from './plans-map-wrapper';

describe('getPlan', () => {
    it('should return matching currency', () => {
        const prefferedCurrency = 'BRL';

        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'CHF',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'BRL',
            } as Plan,
        ];

        const plan = getPlanByName(plans, PLANS.MAIL, prefferedCurrency);
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'BRL',
        });
    });

    it('should respect currency fallback', () => {
        const prefferedCurrency = 'BRL';

        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'CHF',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'EUR',
            } as Plan,
        ];

        const plan = getPlanByName(plans, PLANS.MAIL, prefferedCurrency);
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'EUR',
        });
    });

    it('should return any currency if fallback currency does not exist', () => {
        const prefferedCurrency = 'BRL';

        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'CHF',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'EUR',
            } as Plan,
        ];

        const plan = getPlanByName(plans, PLANS.MAIL, prefferedCurrency);
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'EUR',
        });
    });

    it('should return undefined if plan is not found', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
        ];
        const plan = getPlanByName(plans, {}, 'USD');
        expect(plan).toBeUndefined();
    });

    it('should return plan by PlanIDs', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
        ];
        const plan = getPlanByName(
            plans,
            {
                [PLANS.MAIL]: 1,
            },
            'USD'
        );
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'USD',
        });
    });
});

describe('getStrictPlanByName', () => {
    it('should return a strict plan', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Type: PLAN_TYPES.PLAN,
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Type: PLAN_TYPES.ADDON,
            } as Plan,
        ];

        const strictPlan = getStrictPlanByName(plans, PLANS.MAIL, 'USD');
        expect(strictPlan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'USD',
            Type: PLAN_TYPES.PLAN,
        });
    });

    it('should not return an addon plan', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Type: PLAN_TYPES.ADDON,
            } as Plan,
        ];

        const strictPlan = getStrictPlanByName(plans, PLANS.MAIL, 'USD');
        expect(strictPlan).toBeUndefined();
    });
});

describe('planExists', () => {
    it('should return true if plan exists', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Pricing: { 1: 999, 12: 9999 },
            } as Plan,
        ];

        expect(planExists(plans, PLANS.MAIL, 'USD', 1)).toBe(true);
    });

    it('should return false if plan does not exist', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Pricing: { 1: 999, 12: 9999 },
            } as Plan,
        ];

        expect(planExists(plans, PLANS.VPN2024, 'USD', 1)).toBe(false);
    });

    it('should return false if currency does not match', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Pricing: { 1: 999, 12: 9999 },
            } as Plan,
        ];

        expect(planExists(plans, PLANS.MAIL, 'EUR', 1)).toBe(false);
    });
});

describe('getPlansMap', () => {
    it('should return a map of plans', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
            {
                Name: PLANS.VPN2024,
                Currency: 'USD',
            } as Plan,
        ];

        const plansMap = getPlansMap(plans, 'USD');
        expect(plansMap).toEqual({
            [PLANS.MAIL]: { Name: PLANS.MAIL, Currency: 'USD' },
            [PLANS.VPN2024]: { Name: PLANS.VPN2024, Currency: 'USD' },
        });
    });
});

describe('planToPlanIDs', () => {
    it('should return an empty object for FREE plan', () => {
        const plan: Plan = { Name: PLANS.FREE } as Plan;
        expect(planToPlanIDs(plan)).toEqual({});
    });

    it('should return a PlanIDs object for non-FREE plans', () => {
        const plan: Plan = { Name: PLANS.MAIL } as Plan;
        expect(planToPlanIDs(plan)).toEqual({ [PLANS.MAIL]: 1 });
    });
});

describe('getAvailableCycles', () => {
    it('should return available cycles', () => {
        const plan: Plan = {
            Name: PLANS.MAIL,
            Pricing: { 1: 999, 12: 9999, 24: 19999 },
        } as Plan;

        expect(getAvailableCycles(plan)).toEqual([1, 12, 24]);
    });

    it('should return an empty array if no pricing is available', () => {
        const plan: Plan = {
            Name: PLANS.MAIL,
        } as Plan;

        expect(getAvailableCycles(plan)).toEqual([]);
    });
});

describe('hasCycle', () => {
    it('should return true if cycle is available', () => {
        const plan: Plan = {
            Name: PLANS.MAIL,
            Pricing: { 1: 999, 12: 9999 },
        } as Plan;

        expect(hasCycle(plan, 12 as Cycle)).toBe(true);
    });

    it('should return false if cycle is not available', () => {
        const plan: Plan = {
            Name: PLANS.MAIL,
            Pricing: { 1: 999, 12: 9999 },
        } as Plan;

        expect(hasCycle(plan, 24 as Cycle)).toBe(false);
    });
});

describe('DRIVE_1TB plan', () => {
    it('should find DRIVE_1TB plan by name', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.DRIVE_1TB,
                Currency: 'USD',
                Pricing: { 1: 999, 12: 9588 },
            } as Plan,
        ];

        const plan = getPlanByName(plans, PLANS.DRIVE_1TB, 'USD');
        expect(plan).toEqual({
            Name: PLANS.DRIVE_1TB,
            Currency: 'USD',
            Pricing: { 1: 999, 12: 9588 },
        });
    });

    it('should verify DRIVE_1TB plan exists with correct cycles', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.DRIVE_1TB,
                Currency: 'USD',
                Pricing: { 1: 999, 12: 9588 },
            } as Plan,
        ];

        expect(planExists(plans, PLANS.DRIVE_1TB, 'USD', 1)).toBe(true);
        expect(planExists(plans, PLANS.DRIVE_1TB, 'USD', 12)).toBe(true);
    });

    it('should include DRIVE_1TB in plans map', () => {
        const plans: Plan[] = [
            {
                Name: PLANS.DRIVE_1TB,
                Currency: 'USD',
                Pricing: { 1: 999, 12: 9588 },
            } as Plan,
        ];

        const plansMap = getPlansMap(plans, 'USD');
        expect(plansMap[PLANS.DRIVE_1TB]).toEqual({
            Name: PLANS.DRIVE_1TB,
            Currency: 'USD',
            Pricing: { 1: 999, 12: 9588 },
        });
    });
});
