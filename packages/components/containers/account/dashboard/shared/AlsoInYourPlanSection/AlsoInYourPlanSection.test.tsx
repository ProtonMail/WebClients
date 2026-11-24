import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { prodCatalogGrantsForTesting } from '@proton/payments/testing/prodCatalogGrantsForTesting';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { buildPreloadedState } from '../../../../../testing/buildPreloadedState';
import { renderWithProviders } from '../../../../../testing/renderWithProviders';
import AlsoInYourPlanSection from './AlsoInYourPlanSection';
import AlsoInYourPlanProtonMail from './products/AlsoInYourPlanProtonMail';

const freeUser: Partial<UserModel> = { isFree: true, isPaid: false, Subscribed: 0 };
const passLifetimeUser: Partial<UserModel> = { ...freeUser, hasPassLifetime: true };
const paidMember: Partial<UserModel> = { isAdmin: false, isMember: true, isPaid: true, isFree: false };
const freeSubscription = FREE_SUBSCRIPTION as unknown as Subscription;

const mailPlus = buildSubscription(PLANS.MAIL, { ID: 'mail-plus' });
const passPlus = buildSubscription(PLANS.PASS, { ID: 'pass-plus' });
const vpnPlus = buildSubscription(PLANS.VPN2024, { ID: 'vpn-plus' });
const unlimited = buildSubscription(PLANS.BUNDLE, { ID: 'unlimited' });
const lumoPlus = buildSubscription(PLANS.LUMO, { ID: 'lumo-plus' });

const withSecondary = (first: Subscription, second: Subscription): Subscription => ({
    ...first,
    SecondarySubscriptions: [second],
});

const mailPlusCopy = 'Communicate and schedule with end-to-end encryption.';
const unlimitedAddresses = '15 email addresses/aliases';

const renderSection = ({
    app,
    subscription,
    user,
}: {
    app: APP_NAMES;
    subscription: Subscription;
    user?: Partial<UserModel>;
}) =>
    renderWithProviders(
        <AlsoInYourPlanSection app={app}>
            <AlsoInYourPlanProtonMail />
        </AlsoInYourPlanSection>,
        {
            preloadedState: {
                ...buildPreloadedState({ user, subscription }),
                entitlementCatalog: getModelState(buildEntitlementCatalog(prodCatalogGrantsForTesting)),
            },
        }
    );

describe('AlsoInYourPlanSection', () => {
    it('describes the free plan to a free user', () => {
        renderSection({ app: APPS.PROTONMAIL, subscription: freeSubscription, user: freeUser });

        expect(
            screen.getByText('With Proton Free, you get free access to all Proton privacy services.')
        ).toBeInTheDocument();
        expect(screen.getByText(mailPlusCopy)).toBeInTheDocument();
    });

    it('describes the Pass lifetime plan to a Pass lifetime user without subscriptions', () => {
        renderSection({ app: APPS.PROTONPASS, subscription: freeSubscription, user: passLifetimeUser });

        expect(
            screen.getByText(
                'With Pass + SimpleLogin Lifetime, you get free access to Proton VPN and other privacy services.'
            )
        ).toBeInTheDocument();
    });

    it('describes a single Mail Plus subscription', () => {
        renderSection({ app: APPS.PROTONMAIL, subscription: mailPlus });

        expect(
            screen.getByText('With Mail Plus, you get free access to Proton VPN and other privacy services.')
        ).toBeInTheDocument();
        expect(screen.getByText(mailPlusCopy)).toBeInTheDocument();
    });

    it.each([
        { plan: PLANS.DUO, title: 'Proton Duo' },
        { plan: PLANS.VISIONARY, title: 'Visionary' },
    ] as const)('describes a single $title subscription as a bundle', ({ plan, title }) => {
        renderSection({ app: APPS.PROTONMAIL, subscription: buildSubscription(plan) });

        expect(screen.getByText(`Get more from your ${title} subscription.`)).toBeInTheDocument();
        expect(screen.queryByText(mailPlusCopy)).not.toBeInTheDocument();
    });

    it.each([
        { order: 'Mail Plus first', subscription: withSecondary(mailPlus, passPlus) },
        { order: 'Pass Plus first', subscription: withSecondary(passPlus, mailPlus) },
    ] as const)('names the subscription for the app with Mail Plus and Pass Plus, $order', ({ subscription }) => {
        const { unmount } = renderSection({ app: APPS.PROTONMAIL, subscription });

        expect(
            screen.getByText('With Mail Plus, you get free access to Proton VPN and other privacy services.')
        ).toBeInTheDocument();

        unmount();
        renderSection({ app: APPS.PROTONPASS, subscription });

        expect(
            screen.getByText('With Pass Plus, you get free access to Proton VPN and other privacy services.')
        ).toBeInTheDocument();
    });

    it.each([
        { order: 'Mail Plus first', subscription: withSecondary(mailPlus, vpnPlus) },
        { order: 'VPN Plus first', subscription: withSecondary(vpnPlus, mailPlus) },
    ] as const)('does not offer VPN to a user who also has VPN Plus, $order', ({ subscription }) => {
        renderSection({ app: APPS.PROTONMAIL, subscription });

        expect(
            screen.getByText('With Mail Plus, you get free access to all Proton privacy services.')
        ).toBeInTheDocument();
    });

    it.each([
        { order: 'Unlimited first', subscription: withSecondary(unlimited, lumoPlus) },
        { order: 'Lumo Plus first', subscription: withSecondary(lumoPlus, unlimited) },
    ] as const)('shows all Unlimited features with Unlimited and Lumo Plus, $order', ({ subscription }) => {
        renderSection({ app: APPS.PROTONMAIL, subscription });

        expect(screen.getByText('Get more from your Proton Unlimited subscription.')).toBeInTheDocument();
        expect(screen.getByText(unlimitedAddresses)).toBeInTheDocument();
        expect(screen.queryByText(mailPlusCopy)).not.toBeInTheDocument();
    });

    it('keeps loading for a paid member who cannot read the subscription', () => {
        renderSection({ app: APPS.PROTONMAIL, subscription: freeSubscription, user: paidMember });

        expect(screen.queryByText('Also in your plan')).not.toBeInTheDocument();
    });
});
