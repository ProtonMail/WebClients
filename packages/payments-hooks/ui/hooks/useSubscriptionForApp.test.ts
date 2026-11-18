import { renderHook } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';

import { useSubscriptionForApp } from './useSubscriptionForApp';

vi.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: vi.fn(),
}));

vi.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementCatalog: vi.fn(),
}));

vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: vi.fn(),
}));

const catalog = buildEntitlementCatalog({
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
    [PLANS.MAIL]: [EntitlementName.FlagsInbox],
});

describe('useSubscriptionForApp', () => {
    beforeEach(() => {
        vi.mocked(useEntitlementCatalog).mockReturnValue([catalog, false]);
    });

    it('returns the subscription that covers the current app', () => {
        const vpn = buildSubscription(PLANS.VPN2024);
        const mail = buildSubscription(PLANS.MAIL);
        vi.mocked(useAllSubscriptions).mockReturnValue([[vpn, mail], false]);
        vi.mocked(useConfig).mockReturnValue({ APP_NAME: APPS.PROTONMAIL } as ReturnType<typeof useConfig>);

        const { result } = renderHook(() => useSubscriptionForApp());

        expect(result.current).toEqual([mail, false]);
    });

    it('returns the subscription that covers the requested app instead of the current one', () => {
        const vpn = buildSubscription(PLANS.VPN2024);
        const mail = buildSubscription(PLANS.MAIL);
        vi.mocked(useAllSubscriptions).mockReturnValue([[vpn, mail], false]);
        vi.mocked(useConfig).mockReturnValue({ APP_NAME: APPS.PROTONACCOUNT } as ReturnType<typeof useConfig>);

        const { result } = renderHook(() => useSubscriptionForApp(APPS.PROTONCALENDAR));

        expect(result.current).toEqual([mail, false]);
    });

    it('reports loading while the subscriptions load', () => {
        vi.mocked(useAllSubscriptions).mockReturnValue([undefined, true]);
        vi.mocked(useConfig).mockReturnValue({ APP_NAME: APPS.PROTONMAIL } as ReturnType<typeof useConfig>);

        const { result } = renderHook(() => useSubscriptionForApp());

        expect(result.current).toEqual([undefined, true]);
    });
});
