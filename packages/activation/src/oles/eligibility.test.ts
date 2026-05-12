import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders';

import { isOLESEligible } from './eligibility';

const baseOrganization: Partial<Organization> = {
    RequiresKey: 1,
    HasKeys: 1,
    State: ORGANIZATION_STATE.ACTIVE,
    MaxMembers: 1,
    PlanName: PLANS.BUNDLE_PRO_2024,
};

const baseUser: Partial<UserModel> = {
    isAdmin: true,
    isSelf: true,
};

const baseSubscription = buildSubscription(baseOrganization.PlanName);

const eligibleArgs = () => ({
    user: baseUser as UserModel,
    organization: baseOrganization as Organization,
    subscription: baseSubscription as MaybeFreeSubscription,
});

describe('isOLESEligible', () => {
    it('returns true when all conditions are met', () => {
        expect(isOLESEligible(eligibleArgs())).toBe(true);
    });

    it('returns false when organization is undefined', () => {
        expect(isOLESEligible({ ...eligibleArgs(), organization: undefined })).toBe(false);
    });

    it('returns false when user is undefined', () => {
        expect(isOLESEligible({ ...eligibleArgs(), user: undefined })).toBe(false);
    });

    it('returns false when subscription is undefined', () => {
        expect(isOLESEligible({ ...eligibleArgs(), subscription: undefined })).toBe(false);
    });

    it('returns false when user is not an admin', () => {
        expect(isOLESEligible({ ...eligibleArgs(), user: { ...baseUser, isAdmin: false } as UserModel })).toBe(false);
    });

    it('returns false when user is not self', () => {
        expect(isOLESEligible({ ...eligibleArgs(), user: { ...baseUser, isSelf: false } as UserModel })).toBe(false);
    });

    it('returns false when organization has no keys (RequiresKey unset)', () => {
        expect(
            isOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, RequiresKey: 0 } as Organization,
            })
        ).toBe(false);
    });

    it('returns false when organization keys have not been generated (HasKeys unset)', () => {
        expect(
            isOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, HasKeys: 0 } as Organization,
            })
        ).toBe(false);
    });

    it('returns false when organization is delinquent', () => {
        expect(
            isOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, State: ORGANIZATION_STATE.DELINQUENT } as Organization,
            })
        ).toBe(false);
    });

    it('returns false when organization plan is not B2B', () => {
        expect(
            isOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, PlanName: PLANS.BUNDLE } as Organization,
            })
        ).toBe(false);
    });

    describe('plan coverage', () => {
        const supportedPlans: PLANS[] = [
            PLANS.MAIL_BUSINESS,
            PLANS.MAIL_PRO,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.BUNDLE_BIZ_2025,
        ];

        const unsupportedPlans = Object.values(PLANS).filter((k) => !supportedPlans.includes(k));

        const planExpectations: [boolean, PLANS][] = [
            ...supportedPlans.map((p): [boolean, PLANS] => [true, p]),
            ...unsupportedPlans.map((p): [boolean, PLANS] => [false, p]),
        ];

        it.each(planExpectations)('returns %s for plan %s', (expected, plan) => {
            const organization = { ...baseOrganization, PlanName: plan } as Organization;
            const subscription = plan === PLANS.FREE ? FREE_SUBSCRIPTION : buildSubscription(plan);
            expect(isOLESEligible({ ...eligibleArgs(), organization, subscription })).toBe(expected);
        });
    });
});
