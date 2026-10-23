import { act, screen } from '@testing-library/react';
import { addDays, getUnixTime } from 'date-fns';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';

import { renderWithProviders } from '../../testing/renderWithProviders';
import TrialTopBanner from './TrialTopBanner';
import { OPEN_TRIAL_CANCELED_MODAL } from './constants';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    ...jest.requireActual('@proton/account/entitlementCatalog/hooks'),
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('@proton/account/paymentMethods/hooks', () => ({
    ...jest.requireActual('@proton/account/paymentMethods/hooks'),
    usePaymentMethods: jest.fn(),
}));

jest.mock('./TrialCanceledModal', () => ({
    __esModule: true,
    default: () => <div data-testid="trial-canceled-modal" />,
}));

describe('TrialTopBanner', () => {
    const inThreeDays = () => getUnixTime(addDays(new Date(), 3));

    const inTenDays = () => getUnixTime(addDays(new Date(), 10));

    const buildB2BTrial = (plan: PLANS, ID: string, PeriodEnd = inThreeDays()) =>
        buildSubscription(plan, { ID, IsTrial: true, PeriodEnd });

    const buildPaidMail = () => buildSubscription(PLANS.MAIL, { ID: 'paid-mail', IsTrial: false });

    const withSecondary = (first: Subscription, ...secondary: Subscription[]): Subscription => ({
        ...first,
        SecondarySubscriptions: secondary,
    });

    const renderBanner = (subscription: Subscription) =>
        renderWithProviders(<TrialTopBanner app={APPS.PROTONMAIL} />, {
            preloadedState: { subscription: getSubscriptionState(subscription) },
        });

    const openTrialCanceledModal = () => {
        act(() => {
            document.dispatchEvent(new CustomEvent(OPEN_TRIAL_CANCELED_MODAL));
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (usePaymentMethods as jest.Mock).mockReturnValue([[], false]);
        (useEntitlementCatalog as jest.Mock).mockReturnValue([
            buildEntitlementCatalog({
                [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business],
                [PLANS.MAIL_PRO]: [EntitlementName.Business],
                [PLANS.MAIL]: [],
            }),
            false,
        ]);
    });

    it('renders the B2B trial banner once the entitlement catalog is loaded', () => {
        renderBanner(buildB2BTrial(PLANS.BUNDLE_PRO_2024, 'b2b-trial'));

        expect(screen.getByRole('link', { name: 'Add a payment method' })).toHaveAttribute(
            'href',
            '/dashboard#payment-methods'
        );
    });

    it('renders no banner while the entitlement catalog is loading', () => {
        (useEntitlementCatalog as jest.Mock).mockReturnValue([undefined, true]);

        const { container } = renderBanner(buildB2BTrial(PLANS.BUNDLE_PRO_2024, 'b2b-trial'));

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the trial banner of the second subscription when the first one is paid without a trial', () => {
        renderBanner(withSecondary(buildPaidMail(), buildB2BTrial(PLANS.BUNDLE_PRO_2024, 'b2b-trial')));

        expect(screen.getAllByRole('link', { name: 'Add a payment method' })).toHaveLength(1);
        expect(screen.getByText(/left in your trial/)).toHaveTextContent(
            '3 days left in your trial. Add a payment method to avoid losing access. Learn more'
        );
    });

    it.each([
        { name: 'listed second', first: 'later', second: 'sooner' },
        { name: 'listed first', first: 'sooner', second: 'later' },
    ] as const)(
        'renders only the banner of the trial that ends soonest ($name) and one canceled modal',
        ({ first, second }) => {
            const trials = {
                later: buildB2BTrial(PLANS.BUNDLE_PRO_2024, 'b2b-trial-later', inTenDays()),
                sooner: buildB2BTrial(PLANS.MAIL_PRO, 'b2b-trial-sooner', inThreeDays()),
            };

            renderBanner(withSecondary(trials[first], trials[second]));

            expect(screen.getAllByRole('link', { name: 'Add a payment method' })).toHaveLength(1);
            expect(screen.getByText(/left in your trial/)).toHaveTextContent(
                '3 days left in your trial. Add a payment method to avoid losing access. Learn more'
            );

            openTrialCanceledModal();

            expect(screen.getAllByTestId('trial-canceled-modal')).toHaveLength(1);
        }
    );

    it('renders no banner for a paid subscription without a trial but still listens for the trial canceled event', () => {
        renderBanner(buildPaidMail());

        expect(screen.queryByRole('link', { name: 'Add a payment method' })).not.toBeInTheDocument();
        expect(screen.queryByText(/trial/)).not.toBeInTheDocument();

        openTrialCanceledModal();

        expect(screen.getAllByTestId('trial-canceled-modal')).toHaveLength(1);
    });

    it('renders nothing and does not listen for the trial canceled event for a free user', () => {
        const { container } = renderBanner(FREE_SUBSCRIPTION as unknown as Subscription);

        openTrialCanceledModal();

        expect(container).toBeEmptyDOMElement();
    });
});
