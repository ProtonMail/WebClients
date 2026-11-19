import { MemoryRouter, Route } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { IcBell } from '@proton/icons/icons/IcBell';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';

import { SettingsLinkRedirect, type SettingsLinkRedirectRule } from './SettingsLinkRedirect';

vi.mock('@proton/account/allSubscriptions/hooks', () => ({ useAllSubscriptions: vi.fn() }));
vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: vi.fn() }));
vi.mock('@proton/components/containers/layout/PrivateMainAreaLoading', () => ({
    default: function PrivateMainAreaLoading() {
        return <div>Loading</div>;
    },
}));

const mockUseAllSubscriptions = useAllSubscriptions as Mock;
const mockUseOrganization = useOrganization as Mock;

const getSubscriptionLinks = (available = true): SettingsLinkRedirectRule => ({
    hashes: ['#your-subscriptions', '#payment-methods', '#credits', '#gift-code', '#invoices'],
    section: { id: 'subscription', text: 'Subscription', to: '/subscription', icon: IcCreditCard, available },
    keepHash: true,
});

const getNotificationsLinks = (available = true): SettingsLinkRedirectRule => ({
    hashes: ['#email-subscription'],
    section: { id: 'email-notifications', text: 'Notifications', to: '/notifications', icon: IcBell, available },
});

const renderSettingsLinkRedirect = (
    entry: string,
    rules: SettingsLinkRedirectRule[] = [getSubscriptionLinks(), getNotificationsLinks()]
) =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Route path="/vpn/dashboard">
                <SettingsLinkRedirect path="/vpn" rules={rules}>
                    <div>Dashboard</div>
                </SettingsLinkRedirect>
            </Route>
            <Route
                path="/vpn/subscription"
                render={({ location }) => <div>{`Subscription ${location.search}${location.hash}`}</div>}
            />
            <Route
                path="/vpn/notifications"
                render={({ location }) => <div>{`Notifications ${location.search}${location.hash}`}</div>}
            />
        </MemoryRouter>
    );

describe('SettingsLinkRedirect', () => {
    beforeEach(() => {
        mockUseAllSubscriptions.mockReturnValue([[], false]);
        mockUseOrganization.mockReturnValue([{}, false]);
    });

    it('waits for the subscriptions to load before redirecting', () => {
        mockUseAllSubscriptions.mockReturnValue([undefined, true]);

        renderSettingsLinkRedirect('/vpn/dashboard#invoices');

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByText(/Subscription/)).not.toBeInTheDocument();
    });

    it('waits for the organization to load before redirecting', () => {
        mockUseOrganization.mockReturnValue([undefined, true]);

        renderSettingsLinkRedirect('/vpn/dashboard#email-subscription');

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByText(/Notifications/)).not.toBeInTheDocument();
    });

    it('waits for the organization and subscriptions to load without a legacy anchor', () => {
        mockUseAllSubscriptions.mockReturnValue([undefined, true]);
        mockUseOrganization.mockReturnValue([undefined, true]);

        renderSettingsLinkRedirect('/vpn/dashboard');

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it.each(['#your-subscriptions', '#payment-methods', '#credits', '#gift-code', '#invoices'])(
        'redirects %s to the subscription page, keeping the anchor',
        (hash) => {
            renderSettingsLinkRedirect(`/vpn/dashboard${hash}`);

            expect(screen.getByText(`Subscription ${hash}`)).toBeInTheDocument();
        }
    );

    it('redirects to the notifications page without the anchor', () => {
        renderSettingsLinkRedirect('/vpn/dashboard?foo=bar#email-subscription');

        expect(screen.getByText('Notifications ?foo=bar')).toBeInTheDocument();
    });

    it('preserves the search params', () => {
        renderSettingsLinkRedirect('/vpn/dashboard?foo=bar#invoices');

        expect(screen.getByText('Subscription ?foo=bar#invoices')).toBeInTheDocument();
    });

    it('renders children for anchors no rule lists', () => {
        renderSettingsLinkRedirect('/vpn/dashboard#storage');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders children for anchors of rules the route does not pass', () => {
        renderSettingsLinkRedirect('/vpn/dashboard#invoices', [getNotificationsLinks()]);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders children when the target page is not available', () => {
        renderSettingsLinkRedirect('/vpn/dashboard#email-subscription', [getNotificationsLinks(false)]);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});
