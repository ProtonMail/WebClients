import {
    B2B_PLANS_SUPPORTING_SCRIBE,
    PLANS_SUPPORTING_SCRIBE,
    isB2bPlanSupportingScribe,
    isScribeSupported,
} from '@proton/components/helpers/assistant';
import { PLANS } from '@proton/payments';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';

describe('assistant helpers', () => {
    describe('isScribeSupported', () => {
        it('should be true when user is free', () => {
            const user = { isFree: true } as UserModel;
            expect(isScribeSupported(undefined, user)).toBeTruthy();
        });

        it('should be true when user has a valid plan', () => {
            const user = { isFree: false } as UserModel;

            PLANS_SUPPORTING_SCRIBE.forEach((plan) => {
                const organization = { PlanName: plan } as Organization;
                expect(isScribeSupported(organization, user)).toBeTruthy();
            });
        });

        it('should be false when user has not a valid plan', () => {
            const user = { isFree: false } as UserModel;

            const allPlans: PLANS[] = Object.values(PLANS);

            const plansNotSupportingScribe: PLANS[] = allPlans.filter(
                (plan) => !PLANS_SUPPORTING_SCRIBE.includes(plan)
            );
            plansNotSupportingScribe.forEach((plan) => {
                const organization = { PlanName: plan } as Organization;
                expect(isScribeSupported(organization, user)).toBeFalsy();
            });
        });

        it('should be false when user is paid, and has no organization', () => {
            const user = { isFree: false } as UserModel;
            expect(isScribeSupported(undefined, user)).toBeFalsy();
        });
    });

    describe('isB2bPlanSupportingScribe', () => {
        it('should return true if b2b plan supporting scribe', () => {
            const user = { isFree: false } as UserModel;

            B2B_PLANS_SUPPORTING_SCRIBE.forEach((plan) => {
                const organization = { PlanName: plan } as Organization;
                expect(isB2bPlanSupportingScribe(organization, user)).toBeTruthy();
            });
        });

        it('should be false if user is free', () => {
            const user = { isFree: true } as UserModel;
            expect(isB2bPlanSupportingScribe(undefined, user)).toBeFalsy();
        });

        it('should be false when user has not a valid plan', () => {
            const user = { isFree: false } as UserModel;

            const allPlans: PLANS[] = Object.values(PLANS);

            const plansNotSupportingScribe: PLANS[] = allPlans.filter(
                (plan) => !B2B_PLANS_SUPPORTING_SCRIBE.includes(plan)
            );
            plansNotSupportingScribe.forEach((plan) => {
                const organization = { PlanName: plan } as Organization;
                expect(isB2bPlanSupportingScribe(organization, user)).toBeFalsy();
            });
        });
    });
});
