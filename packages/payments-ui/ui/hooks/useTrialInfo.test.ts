import { renderHook } from '@testing-library/react-hooks';

import { useSubscription } from '@proton/account/subscription/hooks';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useTrialInfo } from './useTrialInfo';

jest.mock('@proton/account/subscription/hooks');

describe('useTrialInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns {} when the subscription is unavailable', () => {
        (useSubscription as jest.Mock).mockReturnValue([undefined, false]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({});
    });

    it('returns {} for a free subscription', () => {
        (useSubscription as jest.Mock).mockReturnValue([FREE_SUBSCRIPTION, false]);

        const { result } = renderHook(() => useTrialInfo());

        expect(result.current).toEqual({});
    });

    it('returns B2C trial information from the single account subscription', () => {
        (useSubscription as jest.Mock).mockReturnValue([buildSubscription(PLANS.BUNDLE, { IsTrial: true }), false]);

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

    it('returns B2B trial information based on the account subscription plan', () => {
        (useSubscription as jest.Mock).mockReturnValue([buildSubscription(PLANS.BUNDLE_PRO, { IsTrial: true }), false]);

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
});
