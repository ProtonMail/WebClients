import { renderHook } from '@testing-library/react-hooks';

import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';

import useVPNDrawer from './useVPNDrawer';

// Mock dependencies
jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: jest.fn(),
}));

jest.mock('@proton/components/containers/organization/accessControl/useAllowedProducts', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/payments', () => ({
    getIsB2BAudienceFromPlan: jest.fn(),
}));

describe('useVPNDrawer', () => {
    let mockUseOrganization: jest.Mock;
    let mockUseAllowedProducts: jest.Mock;
    let mockUseConfig: jest.Mock;
    let mockUseFlag: jest.Mock;
    let mockGetIsB2BAudienceFromPlan: jest.Mock;

    beforeAll(() => {
        mockUseOrganization = require('@proton/account/organization/hooks').useOrganization as jest.Mock;
        mockUseAllowedProducts = require('@proton/components/containers/organization/accessControl/useAllowedProducts')
            .default as jest.Mock;
        mockUseConfig = require('@proton/components/hooks/useConfig').default as jest.Mock;
        mockUseFlag = require('@proton/unleash/useFlag').default as jest.Mock;
        mockGetIsB2BAudienceFromPlan = require('@proton/payments').getIsB2BAudienceFromPlan as jest.Mock;
    });

    beforeEach(() => {
        jest.clearAllMocks();
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
