import { renderHook } from '@testing-library/react';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { useVariant } from '@proton/unleash/useVariant';

import { useShouldStartTrial } from './useShouldStartTrial';

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

describe('useShouldStartTrial', () => {
    it('returns true when the plan is trial-eligible and the flag is disabled', () => {
        mockUseVariant.mockReturnValue({ name: 'disabled' });

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(true);
    });

    it('returns true when the plan is trial-eligible and the variant is A', () => {
        mockUseVariant.mockReturnValue({ name: 'A' });

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(true);
    });

    it('returns false when the plan is trial-eligible but the variant is B', () => {
        mockUseVariant.mockReturnValue({ name: 'B' });

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns true when the plan is trial-eligible and requires a credit card but the flag is disabled', () => {
        mockUseVariant.mockReturnValue({ name: 'disabled' });

        const { result } = renderHook(() => useShouldStartTrial(PLANS.BUNDLE));

        expect(result.current).toBe(true);
    });

    it('returns true when the plan is trial-eligible and requires a credit card but the variant is A', () => {
        mockUseVariant.mockReturnValue({ name: 'A' });

        const { result } = renderHook(() => useShouldStartTrial(PLANS.BUNDLE));

        expect(result.current).toBe(true);
    });

    it('returns false when the plan is not trial-eligible', () => {
        mockUseVariant.mockReturnValue({ name: 'disabled' });
        mockUseEligibleTrials.mockReturnValue(createEligibleTrialsMock({ trialPlans: [] }));

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns true for mail on variant B because mail is trial-eligible but does not require a credit card', () => {
        mockUseVariant.mockReturnValue({ name: 'B' });

        const { result } = renderHook(() => useShouldStartTrial(PLANS.MAIL));

        expect(result.current).toBe(true);
    });
});
