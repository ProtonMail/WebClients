import { PLANS } from '@proton/payments/core/constants';

import type { PassPlanResponse } from '../../types/api/pass';
import { PlanType } from '../../types/api/pass';
import { isPassB2BPlan, shouldUpsellUnlimited } from './user.plan';

const createPlan = (Type: PlanType, InternalName: string): PassPlanResponse =>
    ({ Type, InternalName, DisplayName: InternalName }) as PassPlanResponse;

describe('shouldUpsellUnlimited', () => {
    test.each([PLANS.MAIL, PLANS.DRIVE, PLANS.VPN2024])(
        'upsells Unlimited to %s users on the Pass free tier',
        (name) => {
            expect(shouldUpsellUnlimited(createPlan(PlanType.FREE, name))).toBe(true);
        }
    );

    test.each([
        ['no plan', null],
        ['free users', createPlan(PlanType.FREE, PLANS.FREE)],
        ['Pass Plus users', createPlan(PlanType.PLUS, PLANS.PASS)],
        ['Unlimited users', createPlan(PlanType.PLUS, PLANS.BUNDLE)],
        ['B2B users without Pass', createPlan(PlanType.FREE, PLANS.MAIL_PRO)],
    ])('keeps the default upsell for %s', (_, plan) => {
        expect(shouldUpsellUnlimited(plan)).toBe(false);
    });
});

describe('isPassB2BPlan', () => {
    test.each([
        ['Pass Business', createPlan(PlanType.BUSINESS, PLANS.PASS_BUSINESS)],
        ['Pass Essentials typed as free', createPlan(PlanType.FREE, PLANS.PASS_PRO)],
        ['Pass Essentials typed as plus', createPlan(PlanType.PLUS, PLANS.PASS_PRO)],
        ['Pass Professional typed as plus', createPlan(PlanType.PLUS, PLANS.PASS_BUSINESS)],
    ])('matches %s', (_, plan) => {
        expect(isPassB2BPlan(plan)).toBe(true);
    });

    test.each([
        ['no plan', null],
        ['free users', createPlan(PlanType.FREE, PLANS.FREE)],
        ['Pass Plus users', createPlan(PlanType.PLUS, PLANS.PASS)],
        ['Mail Plus users', createPlan(PlanType.FREE, PLANS.MAIL)],
        ['Unlimited users', createPlan(PlanType.PLUS, PLANS.BUNDLE)],
        ['B2B users without Pass', createPlan(PlanType.FREE, PLANS.MAIL_PRO)],
    ])('does not match %s', (_, plan) => {
        expect(isPassB2BPlan(plan)).toBe(false);
    });
});
