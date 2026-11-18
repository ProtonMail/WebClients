import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useOrganization } from '@proton/account/organization/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/payments/plan/helpers';
import { useFlag } from '@proton/unleash/useFlag';

import useAllowedProducts from '../../../../containers/organization/accessControl/useAllowedProducts';
import useVPNDrawer from './useVPNDrawer';

// Mock dependencies
vi.mock('@proton/account/organization/hooks', () => ({
    useOrganization: vi.fn(),
}));

vi.mock('../../../../containers/organization/accessControl/useAllowedProducts', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    useConfig: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/shared/lib/payments/plan/helpers', () => ({
    getIsB2BAudienceFromPlan: vi.fn(),
}));

describe('useVPNDrawer', () => {
    const mockUseOrganization = useOrganization as Mock;
    const mockUseAllowedProducts = useAllowedProducts as Mock;
    const mockUseConfig = useConfig as Mock;
    const mockUseFlag = useFlag as Mock;
    const mockGetIsB2BAudienceFromPlan = getIsB2BAudienceFromPlan as Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementations for passing case
        mockUseOrganization.mockReturnValue([{ PlanName: 'free' }, false]);
        mockUseAllowedProducts.mockReturnValue([new Set([Product.VPN]), false]);
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL });
        mockUseFlag.mockReturnValue(true);
        mockGetIsB2BAudienceFromPlan.mockReturnValue(false);
    });

    it('returns true when all conditions are met', () => {
        const { result } = renderHook(() => useVPNDrawer());
        expect(result.current).toBe(true);
    });

    describe('negative cases', () => {
        it.each([
            ['feature flag is disabled', () => mockUseFlag.mockReturnValue(false)],
            ['VPN is not enabled', () => mockUseAllowedProducts.mockReturnValue([new Set([]), false])],
            ['VPN products are loading', () => mockUseAllowedProducts.mockReturnValue([new Set(), true])],
            ['user is B2B', () => mockGetIsB2BAudienceFromPlan.mockReturnValue(true)],
            ['organization is loading', () => mockUseOrganization.mockReturnValue([null, true])],
            ['not in Mail app', () => mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONCALENDAR })],
        ])('returns false when %s', (_, setupMock) => {
            setupMock();
            const { result } = renderHook(() => useVPNDrawer());
            expect(result.current).toBe(false);
        });

        it('returns false when multiple conditions fail', () => {
            mockUseFlag.mockReturnValue(false);
            mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONCALENDAR });
            mockGetIsB2BAudienceFromPlan.mockReturnValue(true);

            const { result } = renderHook(() => useVPNDrawer());
            expect(result.current).toBe(false);
        });
    });
});
