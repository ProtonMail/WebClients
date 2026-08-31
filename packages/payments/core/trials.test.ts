import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { PLANS } from './constants';
import { TrialType } from './subscription/constants';
import { getTrialInfo, getTrialInfoForSingleSubscription, getTrialSubscription } from './trials';

describe('getTrialInfoForSingleSubscription', () => {
    it('returns B2C trial information for a B2C trial subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, { IsTrial: true });

        expect(getTrialInfoForSingleSubscription(subscription)).toEqual({
            isB2CTrial: true,
            isB2BTrial: false,
            isTrial: true,
            isReferralTrial: false,
            isFamilyTrial: false,
        });
    });

    it('returns B2B trial information for a B2B trial subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE_PRO, { IsTrial: true });

        expect(getTrialInfoForSingleSubscription(subscription)).toEqual({
            isB2CTrial: false,
            isB2BTrial: true,
            isTrial: true,
            isReferralTrial: false,
            isFamilyTrial: false,
        });
    });

    it('identifies referral and family trial types', () => {
        const referralTrial = buildSubscription(PLANS.BUNDLE, {
            IsTrial: true,
            TrialType: TrialType.ReferralProgram,
        });
        const familyTrial = buildSubscription(PLANS.BUNDLE, { IsTrial: true, TrialType: TrialType.FamilyPlan });

        expect(getTrialInfoForSingleSubscription(referralTrial)).toMatchObject({
            isTrial: true,
            isReferralTrial: true,
            isFamilyTrial: false,
        });
        expect(getTrialInfoForSingleSubscription(familyTrial)).toMatchObject({
            isTrial: true,
            isReferralTrial: false,
            isFamilyTrial: true,
        });
    });

    it('returns no trial information for a full subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, { IsTrial: false });

        expect(getTrialInfoForSingleSubscription(subscription)).toEqual({
            isB2CTrial: false,
            isB2BTrial: false,
            isTrial: false,
            isReferralTrial: false,
            isFamilyTrial: false,
        });
    });
});

describe('getTrialInfo', () => {
    it('returns no subscription information when no subscription exists', () => {
        expect(getTrialInfo([])).toEqual({ hasSubscription: false });
    });

    it('returns B2C trial information for a personal trial subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, { IsTrial: true });

        expect(getTrialInfo([subscription])).toEqual({
            hasSubscription: true,
            hasAtLeastOneB2CTrial: true,
            hasAtLeastOneB2BTrial: false,
            hasAtLeastOneTrial: true,
            allSubscriptionsAreTrials: true,
            allSubscriptionsAreFull: false,
            hasReferralTrial: false,
            hasFamilyTrial: false,
        });
    });

    it('returns B2B trial information for a business trial subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE_PRO, { IsTrial: true });

        expect(getTrialInfo([subscription])).toEqual({
            hasSubscription: true,
            hasAtLeastOneB2CTrial: false,
            hasAtLeastOneB2BTrial: true,
            hasAtLeastOneTrial: true,
            allSubscriptionsAreTrials: true,
            allSubscriptionsAreFull: false,
            hasReferralTrial: false,
            hasFamilyTrial: false,
        });
    });

    it('returns referral trial information for a referral program trial', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, { IsTrial: true, TrialType: TrialType.ReferralProgram });

        expect(getTrialInfo([subscription])).toMatchObject({
            hasSubscription: true,
            hasReferralTrial: true,
            hasFamilyTrial: false,
        });
    });

    it('returns family trial information for a family plan trial', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, { IsTrial: true, TrialType: TrialType.FamilyPlan });

        expect(getTrialInfo([subscription])).toMatchObject({
            hasSubscription: true,
            hasReferralTrial: false,
            hasFamilyTrial: true,
        });
    });

    it('returns full subscription information for a non-trial subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, { IsTrial: false });

        expect(getTrialInfo([subscription])).toEqual({
            hasSubscription: true,
            hasAtLeastOneB2CTrial: false,
            hasAtLeastOneB2BTrial: false,
            hasAtLeastOneTrial: false,
            allSubscriptionsAreTrials: false,
            allSubscriptionsAreFull: true,
            hasReferralTrial: false,
            hasFamilyTrial: false,
        });
    });

    it('aggregates B2C and B2B trial subscriptions', () => {
        const b2cTrial = buildSubscription(PLANS.BUNDLE, { IsTrial: true });
        const b2bTrial = buildSubscription(PLANS.BUNDLE_PRO, { IsTrial: true });

        expect(getTrialInfo([b2cTrial, b2bTrial])).toEqual({
            hasSubscription: true,
            hasAtLeastOneB2CTrial: true,
            hasAtLeastOneB2BTrial: true,
            hasAtLeastOneTrial: true,
            allSubscriptionsAreTrials: true,
            allSubscriptionsAreFull: false,
            hasReferralTrial: false,
            hasFamilyTrial: false,
        });
    });

    it('identifies mixed trial and full subscriptions', () => {
        const trial = buildSubscription(PLANS.BUNDLE, { IsTrial: true });
        const fullSubscription = buildSubscription(PLANS.BUNDLE_PRO, { IsTrial: false });

        expect(getTrialInfo([trial, fullSubscription])).toEqual({
            hasSubscription: true,
            hasAtLeastOneB2CTrial: true,
            hasAtLeastOneB2BTrial: false,
            hasAtLeastOneTrial: true,
            allSubscriptionsAreTrials: false,
            allSubscriptionsAreFull: false,
            hasReferralTrial: false,
            hasFamilyTrial: false,
        });
    });
});

describe('getTrialSubscription', () => {
    const fullSubscription = buildSubscription(PLANS.BUNDLE, { IsTrial: false });
    const b2cTrial = buildSubscription(PLANS.BUNDLE, { IsTrial: true });
    const b2bTrial = buildSubscription(PLANS.BUNDLE_PRO, { IsTrial: true });
    const referralTrial = buildSubscription(PLANS.BUNDLE, { IsTrial: true, TrialType: TrialType.ReferralProgram });
    const familyTrial = buildSubscription(PLANS.BUNDLE, { IsTrial: true, TrialType: TrialType.FamilyPlan });
    const subscriptions = [fullSubscription, b2cTrial, b2bTrial, referralTrial, familyTrial];

    it('returns the first trial when no filter is specified', () => {
        expect(getTrialSubscription(subscriptions)).toBe(b2cTrial);
    });

    it('returns the first trial that matches each filter', () => {
        expect(getTrialSubscription(subscriptions, { isB2CTrial: true })).toBe(b2cTrial);
        expect(getTrialSubscription(subscriptions, { isB2BTrial: true })).toBe(b2bTrial);
        expect(getTrialSubscription(subscriptions, { isReferralTrial: true })).toBe(referralTrial);
        expect(getTrialSubscription(subscriptions, { isFamilyTrial: true })).toBe(familyTrial);
    });

    it('returns null when no trial matches the filter', () => {
        expect(getTrialSubscription([fullSubscription], { isB2CTrial: true })).toBeNull();
    });
});
