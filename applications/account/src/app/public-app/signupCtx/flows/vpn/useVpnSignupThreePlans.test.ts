import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useStaticExperiment } from '@proton/account/staticExperiments/useStaticExperiment';
import { PLANS } from '@proton/payments/core/constants';

import { useVpnSignupThreePlans } from './useVpnSignupThreePlans';

vi.mock('@proton/account/staticExperiments/useStaticExperiment', () => ({
    __esModule: true,
    useStaticExperiment: vi.fn(),
}));

const mockUseStaticExperiment = useStaticExperiment as Mock;

const eligibleOptions = {
    mode: 'pricing' as const,
    isB2bPlan: false,
    coupon: undefined,
    trial: undefined,
    preSelectedPlan: undefined,
    urlVariant: 'b',
};

describe('useVpnSignupThreePlans', () => {
    beforeEach(() => {
        mockUseStaticExperiment.mockReturnValue('Treatment');
    });

    it('shows the three plans to eligible users of the Treatment variant', () => {
        const { result } = renderHook(() => useVpnSignupThreePlans(eligibleOptions));

        expect(result.current).toEqual({ variant: 'Treatment', showThreePlans: true });
    });

    it.each([
        ['without the v parameter', undefined],
        ['with another v value', 'a'],
        ['with a value of the VPN 2024 signup experiment', 'pass-addon-only'],
    ])('tags eligible users of the Treatment variant as Control %s', (_, urlVariant) => {
        const { result } = renderHook(() => useVpnSignupThreePlans({ ...eligibleOptions, urlVariant }));

        expect(result.current).toEqual({ variant: 'Control', showThreePlans: false });
    });

    it('tags eligible users of the Control variant without showing the three plans', () => {
        mockUseStaticExperiment.mockReturnValue('Control');

        const { result } = renderHook(() => useVpnSignupThreePlans(eligibleOptions));

        expect(result.current).toEqual({ variant: 'Control', showThreePlans: false });
    });

    it('leaves users out when the experiment is disabled', () => {
        mockUseStaticExperiment.mockReturnValue('disabled');

        const { result } = renderHook(() => useVpnSignupThreePlans(eligibleOptions));

        expect(result.current).toEqual({ variant: undefined, showThreePlans: false });
    });

    it('accepts links that preselect VPN Plus or Proton Unlimited', () => {
        [PLANS.VPN2024, PLANS.BUNDLE].forEach((preSelectedPlan) => {
            const { result } = renderHook(() => useVpnSignupThreePlans({ ...eligibleOptions, preSelectedPlan }));

            expect(result.current.showThreePlans).toBe(true);
        });
    });

    it.each([
        ['the 2-step signup', { mode: 'signup' as const }],
        ['the VPN and Pass promotion', { mode: 'vpn-pass-promotion' as const }],
        ['B2B plans', { isB2bPlan: true }],
        ['coupons', { coupon: 'COUPON' }],
        ['trials', { trial: true }],
        ['links that preselect another plan', { preSelectedPlan: PLANS.VPN_PASS_BUNDLE }],
        ['links that preselect the free plan', { preSelectedPlan: 'free' }],
        [
            'links that preselect another plan, even with ?v=b',
            { preSelectedPlan: PLANS.VPN_PASS_BUNDLE, urlVariant: 'b' },
        ],
    ])('leaves out %s', (_, options) => {
        const { result } = renderHook(() => useVpnSignupThreePlans({ ...eligibleOptions, ...options }));

        expect(result.current).toEqual({ variant: undefined, showThreePlans: false });
    });
});
