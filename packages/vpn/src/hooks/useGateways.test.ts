import { renderHook } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';

import { useGateways } from './useGateways';

vi.mock('@proton/account/allSubscriptions/hooks', () => ({ useAllSubscriptions: vi.fn() }));
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/components/hooks/useFetchData', () => ({
    useFetchData: () => ({ loading: false, result: undefined, refresh: vi.fn() }),
}));

const mockUseAllSubscriptions = useAllSubscriptions as MockedFunction<any>;

const organization = { ID: 'organization', MaxDedicatedIPs: 1 } as Organization;

const renderWithSubscriptions = (plans: PLANS[]) => {
    mockUseAllSubscriptions.mockReturnValue([plans.map((plan) => buildSubscription(plan)), false]);
    return renderHook(() => useGateways(organization, 0)).result.current;
};

describe('useGateways', () => {
    it.each([PLANS.VPN_BUSINESS, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025, PLANS.VPN_PASS_BUNDLE_BUSINESS])(
        'gives gateways access and targets %s for the IP addon',
        (plan) => {
            const { hasGatewaysAccess, planWithIpAddon } = renderWithSubscriptions([plan]);

            expect(hasGatewaysAccess).toBe(true);
            expect(planWithIpAddon).toBe(plan);
        }
    );

    it('denies gateways access to VPN Essentials, which cannot buy the IP addon', () => {
        const { hasGatewaysAccess, planWithIpAddon } = renderWithSubscriptions([PLANS.VPN_PRO]);

        expect(hasGatewaysAccess).toBe(false);
        expect(planWithIpAddon).toBeUndefined();
    });

    it('targets the subscription that supports the IP addon when another subscription comes first', () => {
        const { hasGatewaysAccess, planWithIpAddon } = renderWithSubscriptions([PLANS.LUMO, PLANS.VPN_BUSINESS]);

        expect(hasGatewaysAccess).toBe(true);
        expect(planWithIpAddon).toBe(PLANS.VPN_BUSINESS);
    });

    it('denies gateways access without an organization', () => {
        mockUseAllSubscriptions.mockReturnValue([[buildSubscription(PLANS.VPN_BUSINESS)], false]);

        expect(renderHook(() => useGateways(undefined, 0)).result.current.hasGatewaysAccess).toBe(false);
    });

    it('denies gateways access while there are no subscriptions', () => {
        expect(renderWithSubscriptions([]).hasGatewaysAccess).toBe(false);
    });
});
