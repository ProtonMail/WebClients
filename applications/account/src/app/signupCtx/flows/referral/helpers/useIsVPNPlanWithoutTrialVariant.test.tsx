import { renderHook } from '@testing-library/react';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { PLANS } from '@proton/payments';
import { useFlag } from '@proton/unleash/useFlag';

import { useIsVPNPlanWithoutTrialVariant } from './useIsVPNPlanWithoutTrialVariant';

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

describe('useIsVPNPlanWithoutTrialVariant', () => {
    it('returns true when the flag is enabled and the plan requires a credit card', () => {
        mockUseFlag.mockReturnValue(true);

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.VPN2024));

        expect(result.current).toBe(true);
    });

    it('returns false when the flag is disabled', () => {
        mockUseFlag.mockReturnValue(false);

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.VPN2024));

        expect(result.current).toBe(false);
    });

    it('returns false when the plan does not require a credit card', () => {
        mockUseFlag.mockReturnValue(true);

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.MAIL));

        expect(result.current).toBe(false);
    });

    it('returns true for bundle when the flag is enabled and bundle requires a credit card', () => {
        mockUseFlag.mockReturnValue(true);

        const { result } = renderHook(() => useIsVPNPlanWithoutTrialVariant(PLANS.BUNDLE));

        expect(result.current).toBe(true);
    });
});
