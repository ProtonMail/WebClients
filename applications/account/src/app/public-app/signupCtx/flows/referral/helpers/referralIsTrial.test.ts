import type { EligibleTrials } from '@proton/account/eligibleTrials';
import { PLANS } from '@proton/payments/core/constants';

import { getReferralIsTrial } from './referralIsTrial';

const eligibleTrials: EligibleTrials = {
    trialPlans: [PLANS.BUNDLE, PLANS.MAIL, PLANS.DRIVE, PLANS.PASS, PLANS.VPN2024],
    creditCardRequiredPlans: [PLANS.BUNDLE, PLANS.VPN2024],
};

/**
 * The plan/variant matrix itself is covered by useShouldStartTrial.test.tsx. These cases cover resolving the plan out
 * of the plan IDs that the payments context reports telemetry with.
 */
describe('getReferralIsTrial', () => {
    it('resolves the plan out of the plan IDs', () => {
        expect(getReferralIsTrial({ planIDs: { [PLANS.MAIL]: 1 }, eligibleTrials, isVariantB: true })).toBe(true);
        expect(getReferralIsTrial({ planIDs: { [PLANS.BUNDLE]: 1 }, eligibleTrials, isVariantB: true })).toBe(false);
        expect(getReferralIsTrial({ planIDs: { [PLANS.BUNDLE]: 1 }, eligibleTrials, isVariantB: false })).toBe(true);
    });

    it('ignores a plan quantity of zero', () => {
        expect(
            getReferralIsTrial({
                planIDs: { [PLANS.BUNDLE]: 0, [PLANS.MAIL]: 1 },
                eligibleTrials,
                isVariantB: true,
            })
        ).toBe(true);
    });

    it('returns false when the plan IDs name no plan', () => {
        expect(getReferralIsTrial({ planIDs: {}, eligibleTrials, isVariantB: false })).toBe(false);
    });

    it('returns false for a free plan selection', () => {
        expect(getReferralIsTrial({ planIDs: { [PLANS.FREE]: 1 }, eligibleTrials, isVariantB: false })).toBe(false);
    });

    it('returns false for a plan outside the eligible set', () => {
        expect(getReferralIsTrial({ planIDs: { [PLANS.FAMILY]: 1 }, eligibleTrials, isVariantB: false })).toBe(false);
    });

    it('returns false while the eligibility response is empty', () => {
        expect(
            getReferralIsTrial({
                planIDs: { [PLANS.BUNDLE]: 1 },
                eligibleTrials: { trialPlans: [], creditCardRequiredPlans: [] },
                isVariantB: false,
            })
        ).toBe(false);
    });
});
