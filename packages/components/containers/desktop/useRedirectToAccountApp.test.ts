import { renderHook } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

import { openLinkInBrowser } from './openExternalLink';
import { useRedirectToAccountApp } from './useRedirectToAccountApp';

jest.mock('@proton/shared/lib/helpers/desktop', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/desktop'),
    isElectronApp: true,
}));

jest.mock('./useHasInboxDesktopInAppPayments', () => ({
    useHasInboxDesktopInAppPayments: () => false,
}));

jest.mock('./openExternalLink', () => ({
    openLinkInBrowser: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

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
    [PLANS.MAIL]: [EntitlementName.FlagsInbox],
    [PLANS.DRIVE]: [EntitlementName.FlagsDrive],
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
});

const getOpenedPlan = ({
    appName,
    plans,
    params,
}: {
    appName: APP_NAMES;
    plans: PLANS[];
    params: Parameters<ReturnType<typeof useRedirectToAccountApp>>[0];
}) => {
    jest.mocked(useUser).mockReturnValue([buildUser(), false]);
    jest.mocked(useAllSubscriptions).mockReturnValue([plans.map((plan) => buildSubscription(plan)), false]);
    jest.mocked(useEntitlementCatalog).mockReturnValue([catalog, false]);
    jest.mocked(useConfig).mockReturnValue({ APP_NAME: appName } as ReturnType<typeof useConfig>);

    const { result } = renderHook(() => useRedirectToAccountApp());
    result.current(params);

    const openedUrl = jest.mocked(openLinkInBrowser).mock.lastCall?.[0] ?? '';
    return new URLSearchParams(openedUrl.split('?')[1]).get('plan');
};

describe('useRedirectToAccountApp', () => {
    beforeEach(() => {
        jest.mocked(openLinkInBrowser).mockClear();
    });

    it('starts from the plan of the only subscription when no plan is given', () => {
        expect(getOpenedPlan({ appName: APPS.PROTONMAIL, plans: [PLANS.VPN2024], params: {} })).toBe(PLANS.VPN2024);
    });

    it('starts from the subscription that covers the current app', () => {
        expect(getOpenedPlan({ appName: APPS.PROTONMAIL, plans: [PLANS.VPN2024, PLANS.MAIL], params: {} })).toBe(
            PLANS.MAIL
        );
    });

    it('starts from the subscription that covers the target app when one is given', () => {
        expect(
            getOpenedPlan({
                appName: APPS.PROTONMAIL,
                plans: [PLANS.MAIL, PLANS.DRIVE],
                params: { app: APPS.PROTONDRIVE },
            })
        ).toBe(PLANS.DRIVE);
    });

    it('keeps the plan given by the caller', () => {
        expect(
            getOpenedPlan({
                appName: APPS.PROTONMAIL,
                plans: [PLANS.VPN2024, PLANS.MAIL],
                params: { planIDs: { [PLANS.BUNDLE]: 1 } },
            })
        ).toBe(PLANS.BUNDLE);
    });
});
