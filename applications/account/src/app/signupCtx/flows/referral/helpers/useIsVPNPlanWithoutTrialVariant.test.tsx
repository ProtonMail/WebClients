import { renderHook } from '@testing-library/react';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { useVariant } from '@proton/unleash/useVariant';

import {
    useIsVPNPlanWithoutTrialVariant,
    useIsVPNReferralWithoutTrialVariantB,
} from './useIsVPNPlanWithoutTrialVariant';

jest.mock('@proton/unleash/useVariant');
jest.mock('@proton/account/eligibleTrials/hooks');

const mockUseVariant = jest.mocked(useVariant);
const mockUseEligibleTrials = jest.mocked(useEligibleTrials);

const createEligibleTrialsMock = (
    overrides: Partial<{ trialPlans: string[]; creditCardRequiredPlans: string[] }> = {}
) => ({
    eligibleTrials: {
        trialPlans: ['bundle2022', 'mail2022', 'drive2022', 'pass2023', 'vpn2024'],
        creditCardRequiredPlans: ['bundle2022', 'vpn2024'],
        ...overrides,
    },
    loading: false,
    fetchEligibleTrials: jest.fn(),
});

beforeEach(() => {
    jest.clearAllMocks();
    mockUseEligibleTrials.mockReturnValue(createEligibleTrialsMock());
});

describe('useIsVPNReferralWithoutTrialVariantB', () => {
    it('returns false when the flag is disabled', () => {
        mockUseVariant.mockReturnValue({ name: 'disabled' });

        const { result } = renderHook(() => useIsVPNReferralWithoutTrialVariantB());

        expect(result.current).toBe(false);
    });

    it('returns false on variant A', () => {
        mockUseVariant.mockReturnValue({ name: 'A' });

        const { result } = renderHook(() => useIsVPNReferralWithoutTrialVariantB());

        expect(result.current).toBe(false);
    });

    it('returns true on variant B', () => {
        mockUseVariant.mockReturnValue({ name: 'B' });

        const { result } = renderHook(() => useIsVPNReferralWithoutTrialVariantB());

        expect(result.current).toBe(true);
    });
});

describe('useIsVPNPlanWithoutTrialVariant', () => {
    it('returns true when the variant is B and the plan requires a credit card', () => {
        mockUseVariant.mockReturnValue({ name: 'B' });

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.VPN2024));

        expect(result.current).toBe(true);
    });

    it('returns false when the flag is disabled', () => {
        mockUseVariant.mockReturnValue({ name: 'disabled' });

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns false when the variant is A', () => {
        mockUseVariant.mockReturnValue({ name: 'A' });

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns false when the plan does not require a credit card', () => {
        mockUseVariant.mockReturnValue({ name: 'B' });

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.MAIL));

        expect(result.current).toBe(false);
    });

    it('returns true for bundle when the variant is B and bundle requires a credit card', () => {
        mockUseVariant.mockReturnValue({ name: 'B' });

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.BUNDLE));

        expect(result.current).toBe(true);
    });
});
