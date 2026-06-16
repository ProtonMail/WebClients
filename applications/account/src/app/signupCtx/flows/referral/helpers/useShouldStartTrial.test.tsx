import { renderHook } from '@testing-library/react';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { PLANS } from '@proton/payments';
import { useFlag } from '@proton/unleash/useFlag';

import { useShouldStartTrial } from './useShouldStartTrial';

jest.mock('@proton/unleash/useFlag');
jest.mock('@proton/account/eligibleTrials/hooks');

const mockUseFlag = jest.mocked(useFlag);
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
    it('returns true when the plan is trial-eligible and the VPN without trial variant is disabled', () => {
        mockUseFlag.mockReturnValue(false);

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(true);
    });

    it('returns false when the plan is trial-eligible but the VPN without trial variant is enabled', () => {
        mockUseFlag.mockReturnValue(true);

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns true when the plan is trial-eligible and requires a credit card but the flag is disabled', () => {
        mockUseFlag.mockReturnValue(false);

        const { result } = renderHook(() => useShouldStartTrial(PLANS.BUNDLE));

        expect(result.current).toBe(true);
    });

    it('returns false when the plan is not trial-eligible', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseEligibleTrials.mockReturnValue(createEligibleTrialsMock({ trialPlans: [] }));

        const { result } = renderHook(() => useShouldStartTrial(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns true for mail when the flag is enabled because mail is trial-eligible but does not require a credit card', () => {
        mockUseFlag.mockReturnValue(true);

        const { result } = renderHook(() => useShouldStartTrial(PLANS.MAIL));

        expect(result.current).toBe(true);
    });
});
