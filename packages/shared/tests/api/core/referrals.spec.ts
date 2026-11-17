import { getPlans } from '../../../lib/api/core/referrals';
import { ADDON_NAMES, PLANS } from '../../../lib/payments/constants';
import type { PlanIDs } from '../../../lib/payments/interface';

const B2C_PLAN = PLANS.BUNDLE;
const B2B_PLAN = PLANS.BUNDLE_BIZ_2025;
const B2C_PLAN_IDS: PlanIDs = { [B2C_PLAN]: 1 };
const B2B_PLAN_IDS: PlanIDs = { [B2B_PLAN]: 1, [ADDON_NAMES.MEMBER_BUNDLE_BIZ_2025]: 6 };
const ZERO_QUANTITY_PLAN_IDS: PlanIDs = { [B2B_PLAN]: 0, [ADDON_NAMES.MEMBER_BUNDLE_BIZ_2025]: 0 };

describe('getPlans', () => {
    describe('when the plan IDs have a quantity', () => {
        it.each<{ planName: PLANS | undefined; planIDs: PlanIDs }>([
            { planName: undefined, planIDs: B2C_PLAN_IDS },
            { planName: B2C_PLAN, planIDs: B2C_PLAN_IDS },
            { planName: B2B_PLAN, planIDs: B2C_PLAN_IDS },
            { planName: undefined, planIDs: B2B_PLAN_IDS },
            { planName: B2C_PLAN, planIDs: B2B_PLAN_IDS },
            { planName: B2B_PLAN, planIDs: B2B_PLAN_IDS },
        ])('returns the plan IDs as they are for $planName and $planIDs', ({ planName, planIDs }) => {
            expect(getPlans(planName, planIDs)).toEqual(planIDs);
        });
    });

    describe('when the plan IDs are missing, empty or all zero', () => {
        it.each<{ planName: PLANS; planIDs: PlanIDs | undefined; expected: PlanIDs }>([
            { planName: B2C_PLAN, planIDs: undefined, expected: { [B2C_PLAN]: 1 } },
            { planName: B2B_PLAN, planIDs: undefined, expected: { [B2B_PLAN]: 1 } },
            { planName: B2C_PLAN, planIDs: {}, expected: { [B2C_PLAN]: 1 } },
            { planName: B2B_PLAN, planIDs: {}, expected: { [B2B_PLAN]: 1 } },
            { planName: B2C_PLAN, planIDs: ZERO_QUANTITY_PLAN_IDS, expected: { [B2C_PLAN]: 1 } },
            { planName: B2B_PLAN, planIDs: ZERO_QUANTITY_PLAN_IDS, expected: { [B2B_PLAN]: 1 } },
        ])('falls back to one unit of $planName for $planIDs', ({ planName, planIDs, expected }) => {
            expect(getPlans(planName, planIDs)).toEqual(expected);
        });
    });

    describe('when there is no plan name and no plan IDs with a quantity', () => {
        it.each<{ planIDs: PlanIDs | undefined }>([
            { planIDs: undefined },
            { planIDs: {} },
            { planIDs: ZERO_QUANTITY_PLAN_IDS },
        ])('returns nothing for $planIDs', ({ planIDs }) => {
            expect(getPlans(undefined, planIDs)).toBeUndefined();
        });
    });
});
