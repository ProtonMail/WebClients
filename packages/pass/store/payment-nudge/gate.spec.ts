import { PLANS } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';

import type { PassPlanResponse } from '../../types';
import { PlanType } from '../../types';
import * as epoch from '../../utils/time/epoch';
import { canQueryPaymentNudge, hasNoPaymentMethod } from './gate';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

const NOW = 1_000;

const createPlan = (plan: Partial<PassPlanResponse> = {}): PassPlanResponse =>
    ({
        Type: PlanType.BUSINESS,
        InternalName: PLANS.PASS_BUSINESS,
        DisplayName: 'Pass Business',
        ManageSubscription: true,
        TrialEnd: NOW + 100,
        ...plan,
    }) as PassPlanResponse;

const createUser = (user: Partial<User> = {}): User => ({ Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1, ...user }) as User;

const createPaymentMethod = (): SavedPaymentMethod => ({ ID: 'method-1' }) as SavedPaymentMethod;

describe('payment nudge gate', () => {
    beforeEach(() => jest.mocked(epoch.getEpoch).mockReturnValue(NOW));

    describe('canQueryPaymentNudge', () => {
        test('accepts an admin on a B2B plan inside the trial window', () => {
            expect(canQueryPaymentNudge(createPlan(), createUser())).toBe(true);
        });

        test('accepts the other B2B plans granting Pass entitlements', () => {
            const plan = (name: PLANS) => createPlan({ Type: PlanType.PLUS, InternalName: name });
            expect(canQueryPaymentNudge(plan(PLANS.BUNDLE_PRO_2024), createUser())).toBe(true);
            expect(canQueryPaymentNudge(plan(PLANS.MAIL_PRO), createUser())).toBe(true);
            expect(canQueryPaymentNudge(plan(PLANS.PASS_PRO), createUser())).toBe(true);
        });

        test('rejects a B2C plan, trial or not', () => {
            const plan = (name: PLANS) => createPlan({ Type: PlanType.PLUS, InternalName: name });
            expect(canQueryPaymentNudge(plan(PLANS.PASS), createUser())).toBe(false);
            expect(canQueryPaymentNudge(plan(PLANS.BUNDLE), createUser())).toBe(false);
            expect(canQueryPaymentNudge(plan(PLANS.PASS_FAMILY), createUser())).toBe(false);
        });

        test('rejects a missing plan or user', () => {
            expect(canQueryPaymentNudge(null, createUser())).toBe(false);
            expect(canQueryPaymentNudge(undefined, createUser())).toBe(false);
            expect(canQueryPaymentNudge(createPlan(), undefined)).toBe(false);
        });

        test('rejects a user who cannot manage the subscription', () => {
            expect(canQueryPaymentNudge(createPlan({ ManageSubscription: false }), createUser())).toBe(false);
        });

        test('rejects a non-admin member of the organization', () => {
            expect(canQueryPaymentNudge(createPlan(), createUser({ Role: USER_ROLES.MEMBER_ROLE }))).toBe(false);
        });

        test('rejects a user without a subscription', () => {
            expect(canQueryPaymentNudge(createPlan(), createUser({ Subscribed: 0 }))).toBe(false);
        });

        test('rejects a plan without a trial end', () => {
            expect(canQueryPaymentNudge(createPlan({ TrialEnd: null }), createUser())).toBe(false);
        });

        test('rejects a trial that has already ended', () => {
            expect(canQueryPaymentNudge(createPlan({ TrialEnd: NOW - 1 }), createUser())).toBe(false);
        });
    });

    describe('hasNoPaymentMethod', () => {
        test('accepts a resolved empty list', () => {
            expect(hasNoPaymentMethod([])).toBe(true);
        });

        test('rejects a list holding a method', () => {
            expect(hasNoPaymentMethod([createPaymentMethod()])).toBe(false);
        });

        test('rejects an unresolved lookup', () => {
            expect(hasNoPaymentMethod(undefined)).toBe(false);
            expect(hasNoPaymentMethod(null)).toBe(false);
        });
    });
});
