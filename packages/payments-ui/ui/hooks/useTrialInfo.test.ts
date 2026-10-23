import { renderHook } from '@testing-library/react-hooks';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useTrialInfo } from './useTrialInfo';

jest.mock('@proton/account/allSubscriptions/hooks');
jest.mock('@proton/account/entitlementCatalog/hooks');

describe('useTrialInfo', () => {
    const entitlementCatalog = buildEntitlementCatalog({
        [PLANS.MAIL]: [],
        [PLANS.PASS]: [],
        [PLANS.BUNDLE]: [],
        [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business],
    });

    const mockSubscriptions = (subscriptions: Subscription[] | undefined, loading = false) => {
        (useAllSubscriptions as jest.Mock).mockReturnValue([subscriptions, loading]);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useEntitlementCatalog as jest.Mock).mockReturnValue([entitlementCatalog, false]);
    });

    it('returns {} while the subscriptions are loading', () => {
        mockSubscriptions(undefined, true);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({});
    });

    it('returns {} when the user has no subscription', () => {
        mockSubscriptions([]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({});
    });

    it('returns full subscription information for a single paid subscription', () => {
        mockSubscriptions([buildSubscription(PLANS.MAIL)]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({
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

    it('returns B2C trial information for a single trial subscription', () => {
        mockSubscriptions([buildSubscription(PLANS.BUNDLE, { IsTrial: true })]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({
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

    it('returns B2B trial information for a single B2B trial subscription', () => {
        mockSubscriptions([buildSubscription(PLANS.BUNDLE_PRO_2024, { IsTrial: true })]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({
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

    it.each([
        { order: 'paid first', paidFirst: true },
        { order: 'trial first', paidFirst: false },
    ] as const)('reports the B2C trial of a second subscription next to a paid one ($order)', ({ paidFirst }) => {
        const paid = buildSubscription(PLANS.MAIL);
        const trial = buildSubscription(PLANS.PASS, { IsTrial: true });
        mockSubscriptions(paidFirst ? [paid, trial] : [trial, paid]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({
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

    it('reports the B2B trial of a second subscription next to a paid B2C one', () => {
        mockSubscriptions([buildSubscription(PLANS.MAIL), buildSubscription(PLANS.BUNDLE_PRO_2024, { IsTrial: true })]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({
            hasSubscription: true,
            hasAtLeastOneB2CTrial: false,
            hasAtLeastOneB2BTrial: true,
            hasAtLeastOneTrial: true,
            allSubscriptionsAreTrials: false,
            allSubscriptionsAreFull: false,
            hasReferralTrial: false,
            hasFamilyTrial: false,
        });
    });
});
