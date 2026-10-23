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

jest.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
}));

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('@proton/app-context/useConfig', () => ({
    useConfig: jest.fn(),
}));

const catalog = buildEntitlementCatalog({
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
    [PLANS.MAIL]: [EntitlementName.FlagsInbox],
});

describe('useSubscriptionForApp', () => {
    beforeEach(() => {
        jest.mocked(useEntitlementCatalog).mockReturnValue([catalog, false]);
    });

    it('returns the subscription that covers the current app', () => {
        const vpn = buildSubscription(PLANS.VPN2024);
        const mail = buildSubscription(PLANS.MAIL);
        jest.mocked(useAllSubscriptions).mockReturnValue([[vpn, mail], false]);
        jest.mocked(useConfig).mockReturnValue({ APP_NAME: APPS.PROTONMAIL } as ReturnType<typeof useConfig>);

        const { result } = renderHook(() => useSubscriptionForApp());

        expect(result.current).toEqual([mail, false]);
    });

    it('reports loading while the subscriptions load', () => {
        jest.mocked(useAllSubscriptions).mockReturnValue([undefined, true]);
        jest.mocked(useConfig).mockReturnValue({ APP_NAME: APPS.PROTONMAIL } as ReturnType<typeof useConfig>);

        const { result } = renderHook(() => useSubscriptionForApp());

        expect(result.current).toEqual([undefined, true]);
    });
});
