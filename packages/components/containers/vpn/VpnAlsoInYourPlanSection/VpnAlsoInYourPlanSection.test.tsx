import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { prodCatalogGrantsForTesting } from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { buildPreloadedState } from '../../../testing/buildPreloadedState';
import { renderWithProviders } from '../../../testing/renderWithProviders';
import { VpnAlsoInYourPlanSection } from './VpnAlsoInYourPlanSection';

jest.mock('../../payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModal: () => [jest.fn(), false],
}));

jest.mock('../../../hooks/useDashboardPaymentFlow', () => () => 'subscription');

const freeUser: Partial<UserModel> = { isFree: true, isPaid: false, Subscribed: 0 };
const passLifetimeUser: Partial<UserModel> = { ...freeUser, hasPassLifetime: true };
const freeSubscription = FREE_SUBSCRIPTION as unknown as Subscription;

const mailPlus = buildSubscription(PLANS.MAIL, { ID: 'mail-plus' });
const vpnPlus = buildSubscription(PLANS.VPN2024, { ID: 'vpn-plus' });
const storeManagedVpnPlus = buildSubscription(PLANS.VPN2024, {
    ID: 'vpn-plus-ios',
    External: SubscriptionPlatform.iOS,
});
const unlimited = buildSubscription(PLANS.BUNDLE, { ID: 'unlimited' });
const lumoPlus = buildSubscription(PLANS.LUMO, { ID: 'lumo-plus' });

const withSecondary = (first: Subscription, second: Subscription): Subscription => ({
    ...first,
    SecondarySubscriptions: [second],
});

const mailCard = 'Communicate and schedule with end-to-end encryption.';
const driveCard = /^Keep your files, photos, and documents safe with/;
const passCard = 'Set secure passwords without the hassle.';
const unlimitedAddresses = '15 email addresses/aliases';
const unlimitedBanner = 'Did you know?';

const renderSection = (subscription: Subscription, user?: Partial<UserModel>) =>
    renderWithProviders(<VpnAlsoInYourPlanSection app={APPS.PROTONVPN_SETTINGS} />, {
        preloadedState: {
            ...buildPreloadedState({ user, subscription }),
            entitlementCatalog: getModelState(buildEntitlementCatalog(prodCatalogGrantsForTesting)),
        },
    });

describe('VpnAlsoInYourPlanSection', () => {
    it('shows the Mail, Drive and Pass cards and the Unlimited banner to a free user', () => {
        renderSection(freeSubscription, freeUser);

        expect(
            screen.getByText('With Proton Free, you get free access to all Proton privacy services.')
        ).toBeInTheDocument();
        expect(screen.getByText(mailCard)).toBeInTheDocument();
        expect(screen.getByText(driveCard)).toBeInTheDocument();
        expect(screen.getByText(passCard)).toBeInTheDocument();
        expect(screen.getByText(unlimitedBanner)).toBeInTheDocument();
    });

    it('renders nothing for a Pass lifetime user without subscriptions', () => {
        renderSection(freeSubscription, passLifetimeUser);

        expect(screen.queryByText('Also in your plan')).not.toBeInTheDocument();
    });

    it('hides the Mail card for a single Mail Plus subscription', () => {
        renderSection(mailPlus);

        expect(
            screen.getByText('With Mail Plus, you get free access to Proton VPN and other privacy services.')
        ).toBeInTheDocument();
        expect(screen.queryByText(mailCard)).not.toBeInTheDocument();
        expect(screen.getByText(driveCard)).toBeInTheDocument();
        expect(screen.getByText(passCard)).toBeInTheDocument();
        expect(screen.getByText(unlimitedBanner)).toBeInTheDocument();
    });

    it('shows all features without the Unlimited banner for a single Duo subscription', () => {
        renderSection(buildSubscription(PLANS.DUO));

        expect(screen.getByText('Get more from your Proton Duo subscription.')).toBeInTheDocument();
        expect(screen.queryByText(mailCard)).not.toBeInTheDocument();
        expect(screen.queryByText(passCard)).not.toBeInTheDocument();
        expect(screen.queryByText(unlimitedBanner)).not.toBeInTheDocument();
    });

    it.each([
        { order: 'Mail Plus first', subscription: withSecondary(mailPlus, vpnPlus) },
        { order: 'VPN Plus first', subscription: withSecondary(vpnPlus, mailPlus) },
    ] as const)(
        'names VPN Plus and offers only Drive and Pass with Mail Plus and VPN Plus, $order',
        ({ subscription }) => {
            renderSection(subscription);

            expect(
                screen.getByText('With VPN Plus, you get free access to all Proton privacy services.')
            ).toBeInTheDocument();
            expect(screen.queryByText(mailCard)).not.toBeInTheDocument();
            expect(screen.getByText(driveCard)).toBeInTheDocument();
            expect(screen.getByText(passCard)).toBeInTheDocument();
            expect(screen.getByText(unlimitedBanner)).toBeInTheDocument();
        }
    );

    it.each([
        { order: 'Unlimited first', subscription: withSecondary(unlimited, lumoPlus) },
        { order: 'Lumo Plus first', subscription: withSecondary(lumoPlus, unlimited) },
    ] as const)(
        'shows all Unlimited features without the banner with Unlimited and Lumo Plus, $order',
        ({ subscription }) => {
            renderSection(subscription);

            expect(screen.getByText('Get more from your Proton Unlimited subscription.')).toBeInTheDocument();
            expect(screen.getByText(unlimitedAddresses)).toBeInTheDocument();
            expect(screen.queryByText(mailCard)).not.toBeInTheDocument();
            expect(screen.queryByText(unlimitedBanner)).not.toBeInTheDocument();
        }
    );

    it('shows the Unlimited banner when only the VPN Plus subscription is managed by an app store', () => {
        renderSection(withSecondary(mailPlus, storeManagedVpnPlus));

        expect(screen.getByText(unlimitedBanner)).toBeInTheDocument();
    });

    it('hides the Unlimited banner for a single VPN Plus subscription managed by an app store', () => {
        renderSection(storeManagedVpnPlus);

        expect(
            screen.getByText('With VPN Plus, you get free access to all Proton privacy services.')
        ).toBeInTheDocument();
        expect(screen.queryByText(unlimitedBanner)).not.toBeInTheDocument();
    });
});
