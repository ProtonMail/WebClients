import { MemoryRouter, Route } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';

import { DashboardLinkRedirect } from './DashboardLinkRedirect';

jest.mock('@proton/account/subscription/hooks', () => ({ useSubscription: jest.fn() }));
jest.mock('@proton/account/organization/hooks', () => ({ useOrganization: jest.fn() }));
jest.mock(
    '@proton/components/containers/layout/PrivateMainAreaLoading',
    () =>
        function PrivateMainAreaLoading() {
            return <div>Loading</div>;
        }
);

const mockUseSubscription = useSubscription as jest.Mock;
const mockUseOrganization = useOrganization as jest.Mock;

const getSubscription = (available: boolean): SectionConfig => ({
    id: 'subscription',
    text: 'Subscription',
    to: '/subscription',
    icon: IcCreditCard,
    available,
});

const renderDashboardLinkRedirect = (entry: string, subscription = getSubscription(true)) =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Route path="/vpn/dashboard">
                <DashboardLinkRedirect path="/vpn" subscription={subscription}>
                    <div>Dashboard</div>
                </DashboardLinkRedirect>
            </Route>
            <Route
                path="/vpn/subscription"
                render={({ location }) => <div>{`Subscription ${location.search}${location.hash}`}</div>}
            />
        </MemoryRouter>
    );

describe('DashboardLinkRedirect', () => {
    beforeEach(() => {
        mockUseSubscription.mockReturnValue([{}, false]);
        mockUseOrganization.mockReturnValue([{}, false]);
    });

    it('waits for the subscription to load before redirecting', () => {
        mockUseSubscription.mockReturnValue([undefined, true]);

        renderDashboardLinkRedirect('/vpn/dashboard#invoices');

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByText(/Subscription/)).not.toBeInTheDocument();
    });

    it('waits for the organization to load before redirecting', () => {
        mockUseOrganization.mockReturnValue([undefined, true]);

        renderDashboardLinkRedirect('/vpn/dashboard#invoices');

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByText(/Subscription/)).not.toBeInTheDocument();
    });

    it.each(['#your-subscriptions', '#payment-methods', '#credits', '#gift-code', '#invoices', '#email-subscription'])(
        'redirects %s to the subscription page',
        (hash) => {
            renderDashboardLinkRedirect(`/vpn/dashboard${hash}`);

            expect(screen.getByText(`Subscription ${hash}`)).toBeInTheDocument();
        }
    );

    it('preserves the search params', () => {
        renderDashboardLinkRedirect('/vpn/dashboard?foo=bar#invoices');

        expect(screen.getByText('Subscription ?foo=bar#invoices')).toBeInTheDocument();
    });

    it('renders children for sections that stayed on the dashboard', () => {
        renderDashboardLinkRedirect('/vpn/dashboard#storage');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders children without a hash', () => {
        renderDashboardLinkRedirect('/vpn/dashboard');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders children when the subscription page is not available', () => {
        renderDashboardLinkRedirect('/vpn/dashboard#invoices', getSubscription(false));

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});
