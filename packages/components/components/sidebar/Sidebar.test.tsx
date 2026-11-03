import { render, screen } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { mockUseConfig } from '@proton/app-context/testing/mockUseConfig';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { mockUseAuthentication } from '../../testing/mockUseAuthentication';
import { mockUseLocation } from '../../testing/mockUseLocation';
import Sidebar from './Sidebar';

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

jest.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
}));

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('../../containers/heading/UserDropdown', () => () => null);

const catalog = buildEntitlementCatalog({
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
    [PLANS.DRIVE]: [EntitlementName.FlagsDrive],
    [PLANS.VISIONARY]: [EntitlementName.FlagsInbox, EntitlementName.FlagsDrive, EntitlementName.FlagsVpn],
});

const freeUser = { isFree: true, isMember: false, canPay: true, UsedSpace: 100, MaxSpace: 1000 } as UserModel;
const paidUser = { ...freeUser, isFree: false };

const renderSidebar = ({
    app,
    user,
    subscriptions,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscriptions: Subscription[];
}) => {
    mockUseConfig({ APP_NAME: app });
    jest.mocked(useUser).mockReturnValue([user, false]);
    jest.mocked(useAllSubscriptions).mockReturnValue([subscriptions, false]);
    render(<Sidebar app={app} appsDropdown={null} />);
};

const getStorageLinkHref = () => screen.queryByTestId('app-used-space')?.closest('a')?.getAttribute('href');

describe('Sidebar storage link', () => {
    beforeEach(() => {
        mockUseLocation();
        mockUseAuthentication({ mode: '' } as any);
        jest.mocked(useEntitlementCatalog).mockReturnValue([catalog, false]);
    });

    it('sends a free user to the upgrade page', () => {
        renderSidebar({ app: APPS.PROTONMAIL, user: freeUser, subscriptions: [] });

        expect(getStorageLinkHref()).toBe('/mail/upgrade?ref=upsell_mail-button-storage');
    });

    it('preselects the plan of the subscription that covers the app', () => {
        renderSidebar({
            app: APPS.PROTONDRIVE,
            user: paidUser,
            subscriptions: [buildSubscription(PLANS.VPN2024), buildSubscription(PLANS.DRIVE)],
        });

        expect(getStorageLinkHref()).toBe(
            '/drive/dashboard?ref=upsell_drive-button-storage&target=compare&plan=drive2022'
        );
    });

    it('shows no link when the subscription that covers the app cannot add storage', () => {
        renderSidebar({
            app: APPS.PROTONDRIVE,
            user: paidUser,
            subscriptions: [buildSubscription(PLANS.VPN2024), buildSubscription(PLANS.VISIONARY)],
        });

        expect(screen.getByTestId('app-used-space')).toBeInTheDocument();
        expect(getStorageLinkHref()).toBeUndefined();
    });
});
