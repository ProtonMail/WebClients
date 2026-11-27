import { PLANS } from '@proton/payments/core/constants';

import type { PassPlanResponse } from '../../types/api/pass';
import { PlanType } from '../../types/api/pass';
import { isPassB2BPlan } from './b2b.utils';

const plan = (Type: PlanType, InternalName: string) => ({ Type, InternalName }) as PassPlanResponse;

describe('isPassB2BPlan', () => {
    test('matches business plans', () => {
        expect(isPassB2BPlan(plan(PlanType.BUSINESS, PLANS.PASS_BUSINESS))).toBe(true);
    });

    test('matches Pass Essentials and Pass Basic, which are reported as Plus', () => {
        expect(isPassB2BPlan(plan(PlanType.PLUS, PLANS.PASS_PRO))).toBe(true);
        expect(isPassB2BPlan(plan(PlanType.PLUS, PLANS.PASS_BASIC))).toBe(true);
    });

    test('does not match consumer plans', () => {
        expect(isPassB2BPlan(plan(PlanType.PLUS, PLANS.PASS))).toBe(false);
        expect(isPassB2BPlan(plan(PlanType.FREE, PLANS.FREE))).toBe(false);
    });
});
