import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders/subscription';

import { TransferManagerBannerType } from '../transferManager.store';
import { TransferManagerBanner } from './TransferManagerBanner';

jest.mock('@proton/components/hooks/useDashboardPaymentFlow', () => () => 'upsell');
jest.mock('@proton/components/containers/payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModalRaw: () => jest.fn(),
}));

const config = {
    APP_NAME: APPS.PROTONDRIVE,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const Providers = ({ children }: PropsWithChildren) => (
    <ConfigProvider config={config}>
        <AuthenticationProvider store={{} as any}>
            <BrowserRouter>{children}</BrowserRouter>
        </AuthenticationProvider>
    </ConfigProvider>
);

describe('TransferManagerBanner', () => {
    describe('StorageFull banner visibility', () => {
        const plansWhereBannerShows = [
            { label: 'free', subscription: FREE_SUBSCRIPTION },
            { label: 'Mail Plus', subscription: buildSubscription(PLANS.MAIL) },
            { label: 'Drive Plus', subscription: buildSubscription(PLANS.DRIVE) },
            { label: 'Drive 1TB', subscription: buildSubscription(PLANS.DRIVE_1TB) },
            { label: 'Unlimited', subscription: buildSubscription(PLANS.BUNDLE) },
            { label: 'Pass Plus', subscription: buildSubscription(PLANS.PASS) },
            { label: 'VPN Plus', subscription: buildSubscription(PLANS.VPN2024) },
        ];

        const plansWhereBannerIsHidden = [
            { label: 'no subscription (public page)', subscription: undefined },
            { label: 'Duo', subscription: buildSubscription(PLANS.DUO) },
            { label: 'Family', subscription: buildSubscription(PLANS.FAMILY) },
            { label: 'Visionary', subscription: buildSubscription(PLANS.VISIONARY) },
        ];

        it.each(plansWhereBannerShows)('shows for $label plan', ({ subscription }) => {
            render(
                <TransferManagerBanner
                    type={TransferManagerBannerType.StorageFull}
                    onAction={jest.fn()}
                    subscription={subscription}
                />,
                { wrapper: Providers }
            );

            expect(screen.getByText('Out of storage space')).toBeInTheDocument();
        });

        it.each(plansWhereBannerIsHidden)('hides for $label plan', ({ subscription }) => {
            render(
                <TransferManagerBanner
                    type={TransferManagerBannerType.StorageFull}
                    onAction={jest.fn()}
                    subscription={subscription}
                />,
                { wrapper: Providers }
            );

            expect(screen.queryByText('Out of storage space')).not.toBeInTheDocument();
        });
    });

    it('renders the StorageFull banner with correct title and description', () => {
        render(
            <TransferManagerBanner
                type={TransferManagerBannerType.StorageFull}
                onAction={jest.fn()}
                subscription={FREE_SUBSCRIPTION}
            />,
            { wrapper: Providers }
        );

        expect(screen.getByText('Out of storage space')).toBeInTheDocument();
        expect(screen.getByText('Upgrade to get more storage space')).toBeInTheDocument();
        expect(screen.getByText('Add storage')).toBeInTheDocument();
    });

    it('calls onAction when the button is clicked', () => {
        const onAction = jest.fn();
        render(
            <TransferManagerBanner
                type={TransferManagerBannerType.StorageFull}
                onAction={onAction}
                subscription={FREE_SUBSCRIPTION}
            />,
            { wrapper: Providers }
        );

        fireEvent.click(screen.getByText('Add storage'));

        expect(onAction).toHaveBeenCalledTimes(1);
    });
});
