import { renderHook } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { defineSidebar } from '@proton/nav/api/defineSidebar';
import { useFlag } from '@proton/unleash/useFlag';

import { resolveNavigation } from '../definitions/routes';
import { useB2BAdminSidebarFeature } from './useB2BAdminSidebarFeature';

vi.mock('@proton/account/addresses/hooks', () => ({ useAddresses: () => [[], false] }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/account/subscription/hooks', () => ({ useSubscription: vi.fn() }));
vi.mock('@proton/account/allSubscriptions/hooks', () => ({ useAllSubscriptions: vi.fn() }));
vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: vi.fn() }));
vi.mock('@proton/account/userPermissions/hooks', () => ({ useUserPermissions: vi.fn() }));
vi.mock('@proton/account/recovery/dataRecovery', () => ({
    useIsDataRecoveryAvailable: () => [{ isDataRecoveryAvailable: true }, false],
}));
vi.mock('@proton/account/recovery/sessionRecoveryHooks', () => ({
    useIsSessionRecoveryAvailable: () => [true, false],
}));
vi.mock('@proton/components/hooks/useRecoveryNotification', () => ({ default: () => undefined }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account' }) }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));
vi.mock('../definitions/routes', () => ({ resolveNavigation: vi.fn(() => 'nav') }));
vi.mock('@proton/nav/api/applyPrefix', () => ({ applyPrefix: vi.fn((nav) => `${nav}-prefixed`) }));
vi.mock('@proton/nav/api/defineSidebar', () => ({ defineSidebar: vi.fn(() => 'sidebar-tree') }));
vi.mock('@proton/nav/api/defineSearchOptions', () => ({ defineSearchOptions: vi.fn(() => 'search-options') }));
vi.mock('@proton/account/entitlementCatalog/hooks', () => ({ useEntitlementChecksForOrgAndUser: vi.fn() }));

const mockUseUser = useUser as MockedFunction<any>;
const mockUseSubscription = useSubscription as MockedFunction<any>;
const mockUseAllSubscriptions = useAllSubscriptions as MockedFunction<any>;
const mockUseOrganization = useOrganization as MockedFunction<any>;
const mockUseUserPermissions = useUserPermissions as MockedFunction<any>;
const mockUseEntitlementChecks = useEntitlementChecksForOrgAndUser as MockedFunction<any>;
const mockUseFlag = useFlag as MockedFunction<typeof useFlag>;
const mockDefineSidebar = defineSidebar as MockedFunction<any>;

const user = { ID: 'user' };
const subscription = { ID: 'subscription' };
const organization = { ID: 'organization' };
const entitlements = { isVpnB2B: true };
const permissions = { 'organization.gateways': true };

describe('useB2BAdminSidebarFeature', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue([user, false]);
        mockUseSubscription.mockReturnValue([subscription, false]);
        mockUseAllSubscriptions.mockReturnValue([[subscription], false]);
        mockUseOrganization.mockReturnValue([organization, false]);
        mockUseUserPermissions.mockReturnValue([{ permissions }, false]);
        mockUseEntitlementChecks.mockReturnValue([entitlements, false]);
        mockUseFlag.mockReturnValue(true);
        mockDefineSidebar.mockReturnValue('sidebar-tree');
    });

    it('is enabled once every input has resolved', () => {
        const { result } = renderHook(() => useB2BAdminSidebarFeature({ prefix: '/vpn' }));

        expect(result.current).toMatchObject({
            enabled: true,
            loading: false,
            nav: 'nav-prefixed',
            routes: 'sidebar-tree',
            settings: 'search-options',
        });
        expect(resolveNavigation).toHaveBeenCalledWith(expect.objectContaining({ allSubscriptions: [subscription] }));
    });

    describe.each([
        ['user', () => mockUseUser.mockReturnValue([undefined, true])],
        ['subscription', () => mockUseSubscription.mockReturnValue([undefined, true])],
        ['all subscriptions', () => mockUseAllSubscriptions.mockReturnValue([undefined, true])],
        ['organization', () => mockUseOrganization.mockReturnValue([undefined, true])],
        ['permissions', () => mockUseUserPermissions.mockReturnValue([{ permissions: null }, true])],
        ['entitlements', () => mockUseEntitlementChecks.mockReturnValue([entitlements, true])],
    ])('while %s is loading', (_name, arrange) => {
        it('reports loading instead of disabled', () => {
            arrange();

            const { result } = renderHook(() => useB2BAdminSidebarFeature({ prefix: '/vpn' }));

            expect(result.current).toEqual({ enabled: false, loading: true, routes: undefined });
        });
    });

    it('is disabled and settled when the feature flag is off', () => {
        mockUseFlag.mockReturnValue(false);

        const { result } = renderHook(() => useB2BAdminSidebarFeature({ prefix: '/vpn' }));

        expect(result.current).toEqual({ enabled: false, loading: false, routes: undefined });
    });

    it('is disabled and settled when the user holds no organization permission', () => {
        mockUseUserPermissions.mockReturnValue([{ permissions: { 'organization.gateways': false } }, false]);

        const { result } = renderHook(() => useB2BAdminSidebarFeature({ prefix: '/vpn' }));

        expect(result.current).toEqual({ enabled: false, loading: false, routes: undefined });
    });

    it('is disabled and settled when the organization is not a vpn business', () => {
        mockUseEntitlementChecks.mockReturnValue([{ isVpnB2B: false }, false]);

        const { result } = renderHook(() => useB2BAdminSidebarFeature({ prefix: '/vpn' }));

        expect(result.current).toEqual({ enabled: false, loading: false, routes: undefined });
    });
});
