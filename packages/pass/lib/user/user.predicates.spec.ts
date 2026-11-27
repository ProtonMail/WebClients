import { PLANS } from '@proton/payments/core/constants';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';

import type { PassPlanResponse } from '../../types/api/pass';
import { isB2BUser } from './user.predicates';

describe('user predicates', () => {
    describe('`isB2BUser`', () => {
        const user = (Role: number) => ({ Role }) as User;
        const plan = (InternalName: string) => ({ InternalName }) as PassPlanResponse;

        const FREE = plan('free');

        test('is false without a user or plan', () => {
            expect(isB2BUser(null, null)).toBe(false);
        });

        test('is false for a free B2C user', () => {
            expect(isB2BUser(user(USER_ROLES.FREE_ROLE), FREE)).toBe(false);
        });

        /* A paid B2C account is ADMIN_ROLE as well, so the role alone cannot be
         * the signal. Mail Plus carries free Pass access, meaning these users
         * are squarely a target of the B2C upsell. */
        test.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.PASS, PLANS.VPN])('is false for a %s admin', (planName) => {
            expect(isB2BUser(user(USER_ROLES.ADMIN_ROLE), plan(planName))).toBe(false);
        });

        test.each([PLANS.MAIL_PRO, PLANS.BUNDLE_PRO, PLANS.PASS_PRO, PLANS.PASS_BUSINESS])(
            'is true for a %s subscription',
            (planName) => {
                expect(isB2BUser(user(USER_ROLES.ADMIN_ROLE), plan(planName))).toBe(true);
                expect(isB2BUser(user(USER_ROLES.MEMBER_ROLE), plan(planName))).toBe(true);
            }
        );

        /* A downgraded organization reports a free plan and its Pass
         * organization state is cleared, but members keep MEMBER_ROLE. */
        test('is true for a member of an organization downgraded to free', () => {
            expect(isB2BUser(user(USER_ROLES.MEMBER_ROLE), FREE)).toBe(true);
        });
    });
});
