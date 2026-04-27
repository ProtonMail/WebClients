import { PLANS, getIsB2BAudienceFromPlan } from '@proton/payments';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';

import { isOLESEligible } from './eligibility';

const baseOrganization: Partial<Organization> = {
    RequiresKey: 1,
    HasKeys: 1,
    State: ORGANIZATION_STATE.ACTIVE,
    MaxMembers: 2,
    PlanName: PLANS.BUNDLE_PRO_2024,
};

const baseUser: Partial<UserModel> = {
    isAdmin: true,
    isSelf: true,
};

// Minimal truthy subscription — getHasMemberCapablePlan falls back to MaxMembers > 1
const baseSubscription = { Plans: [] } as any;

const eligibleArgs = () => ({
    user: baseUser as UserModel,
    organization: baseOrganization as Organization,
    subscription: baseSubscription,
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

    it('returns false when organization cannot have members (MaxMembers <= 1 and no member addons)', () => {
        expect(
            isOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, MaxMembers: 1 } as Organization,
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
        const planB2BStatus: [boolean, PLANS][] = Object.values(PLANS).map((plan) => [
            getIsB2BAudienceFromPlan(plan),
            plan,
        ]);

        it.each(planB2BStatus)('returns %s for plan %s', (expected, plan) => {
            const organization = { ...baseOrganization, PlanName: plan } as Organization;
            expect(isOLESEligible({ ...eligibleArgs(), organization })).toBe(expected);
        });
    });
});
