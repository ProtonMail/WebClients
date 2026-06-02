import { useLocation } from 'react-router-dom';

import { act, renderHook, waitFor } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { getIsVpnB2BPlan } from '@proton/payments';

import { Onboarding } from '../../constants/onboarding';
import { getIsBusinessOnboarded, setBusinessOnboarded } from '../apis/onboarding';
import { ONBOARDING_STEPS } from '../types/Onboarding';
import { useOnboarding } from './useOnboarding';

vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: vi.fn() }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/components/hooks/useApi', () => ({ default: vi.fn() }));
vi.mock('@proton/payments', () => ({ getIsVpnB2BPlan: vi.fn() }));
vi.mock('react-router-dom', () => ({ useLocation: vi.fn() }));
vi.mock('../apis/onboarding', () => ({
    getIsBusinessOnboarded: vi.fn(),
    setBusinessOnboarded: vi.fn(),
}));

const mockUseUser = useUser as MockedFunction<typeof useUser>;
const mockUseOrganization = useOrganization as MockedFunction<typeof useOrganization>;
const mockUseApi = useApi as MockedFunction<typeof useApi>;
const mockGetIsVpnB2BPlan = getIsVpnB2BPlan as MockedFunction<typeof getIsVpnB2BPlan>;
const mockUseLocation = useLocation as MockedFunction<typeof useLocation>;
const mockGetIsBusinessOnboarded = getIsBusinessOnboarded as MockedFunction<typeof getIsBusinessOnboarded>;
const mockSetBusinessOnboarded = setBusinessOnboarded as MockedFunction<typeof setBusinessOnboarded>;

const adminUser = { Role: 2 } as ReturnType<typeof useUser>[0];
const nonAdminUser = { Role: 0 } as ReturnType<typeof useUser>[0];
const organization = { PlanName: 'vpnbiz2023' } as ReturnType<typeof useOrganization>[0];

describe('useOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();

        mockUseUser.mockReturnValue([adminUser, false] as ReturnType<typeof useUser>);
        mockUseOrganization.mockReturnValue([organization, false] as ReturnType<typeof useOrganization>);
        mockUseApi.mockReturnValue(vi.fn());
        mockGetIsVpnB2BPlan.mockReturnValue(true);
        mockUseLocation.mockReturnValue({ search: '' } as ReturnType<typeof useLocation>);
        mockGetIsBusinessOnboarded.mockResolvedValue(false);
        mockSetBusinessOnboarded.mockResolvedValue({ Code: 1000 });
    });

    it('marks the user as NotEligible when they are not an admin', async () => {
        mockUseUser.mockReturnValue([nonAdminUser, false] as ReturnType<typeof useUser>);

        const { result } = renderHook(() => useOnboarding());

        await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotEligible));
        expect(mockGetIsBusinessOnboarded).not.toHaveBeenCalled();
    });

    it('marks the user as NotEligible when the organization is not on a VPN B2B plan', async () => {
        mockGetIsVpnB2BPlan.mockReturnValue(false);

        const { result } = renderHook(() => useOnboarding());

        await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotEligible));
        expect(mockGetIsBusinessOnboarded).not.toHaveBeenCalled();
    });

    it('resolves to Onboarded when the business has already interacted', async () => {
        mockGetIsBusinessOnboarded.mockResolvedValue(true);

        const { result } = renderHook(() => useOnboarding());

        await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.Onboarded));
    });

    it('resolves to NotOnboarded when the business has never interacted', async () => {
        mockGetIsBusinessOnboarded.mockResolvedValue(false);

        const { result } = renderHook(() => useOnboarding());

        await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotOnboarded));
    });

    it('does not re-resolve the step once it has been dismissed', async () => {
        window.localStorage.setItem(Onboarding.onboardingKey, JSON.stringify(ONBOARDING_STEPS.Dismissed));

        const { result } = renderHook(() => useOnboarding());

        expect(result.current[0]).toBe(ONBOARDING_STEPS.Dismissed);
        expect(mockGetIsBusinessOnboarded).not.toHaveBeenCalled();
    });

    it('skips automatic resolution when the prompt param is present', async () => {
        mockUseLocation.mockReturnValue({ search: '?prompt=true' } as ReturnType<typeof useLocation>);

        renderHook(() => useOnboarding());

        await waitFor(() => expect(mockGetIsBusinessOnboarded).not.toHaveBeenCalled());
    });

    it('resolves only once across re-renders', async () => {
        const { result, rerender } = renderHook(() => useOnboarding());

        await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotOnboarded));

        rerender();
        rerender();

        expect(mockGetIsBusinessOnboarded).toHaveBeenCalledTimes(1);
    });

    describe('onboarded()', () => {
        it('sets the step to Onboarded and notifies the API', async () => {
            const { result } = renderHook(() => useOnboarding());
            await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotOnboarded));

            act(() => result.current[1]());

            expect(result.current[0]).toBe(ONBOARDING_STEPS.Onboarded);
            expect(mockSetBusinessOnboarded).toHaveBeenCalledTimes(1);
        });
    });

    describe('complete()', () => {
        it('marks the step as Dismissed', async () => {
            const { result } = renderHook(() => useOnboarding());
            await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotOnboarded));

            act(() => result.current[2]());

            expect(result.current[0]).toBe(ONBOARDING_STEPS.Dismissed);
        });

        it('clears the quick-actions "shown once" flag so a future onboarding starts fresh', async () => {
            window.localStorage.setItem(Onboarding.quickActionsKey, JSON.stringify(false));

            const { result } = renderHook(() => useOnboarding());
            await waitFor(() => expect(result.current[0]).toBe(ONBOARDING_STEPS.NotOnboarded));

            act(() => result.current[2]());

            expect(window.localStorage.getItem(Onboarding.quickActionsKey)).toBeNull();
        });
    });
});
