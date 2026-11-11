import { screen, within } from '@testing-library/react';

import { useConfig } from '@proton/app-context/useConfig';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';
import { FREE_SUBSCRIPTION } from '@proton/shared/lib/payments/constants';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';
import { mockUseFlag } from '@proton/unleash/testing/mockUseFlag';

import { type TestPreloadedStateOverrides, buildPreloadedState } from '../../../../testing/buildPreloadedState';
import { renderWithProviders } from '../../../../testing/renderWithProviders';
import YourPlanSectionV2 from './YourPlanSectionV2';

jest.mock('@proton/app-context/useConfig');
const mockUseConfig = useConfig as jest.MockedFunction<any>;

jest.mock('../../../../hooks/useLoad');

const mockOpenSubscriptionModal = jest.fn();
jest.mock('../subscriptionModalContext', () => ({
    __esModule: true,
    useSubscriptionModal: () => [mockOpenSubscriptionModal, false],
    useSubscriptionModalRaw: () => mockOpenSubscriptionModal,
}));

mockUseFlag().mockReturnValue(false);

const GB = 1024 ** 3;
const JAN_15_2027_NOON_UTC = 1800014400;
const MAR_20_2027_NOON_UTC = 1805544000;

const freeUser = {
    isFree: true,
    isPaid: false,
    canPay: true,
    MaxSpace: 5 * GB,
    UsedSpace: 0,
    MaxBaseSpace: 1 * GB,
    UsedBaseSpace: 0,
    MaxDriveSpace: 5 * GB,
    UsedDriveSpace: 0,
};

const paidUser = {
    isFree: false,
    isPaid: true,
    canPay: true,
    Subscribed: 1,
    MaxSpace: 15 * GB,
    UsedSpace: 0,
};

const freeSubscription = FREE_SUBSCRIPTION as unknown as Subscription;

const passLifetime = { hasPassLifetime: true, Flags: { ...buildUser().Flags, 'pass-lifetime': true } };

const mailPlus = buildSubscription(
    { planName: PLANS.MAIL, currency: 'EUR', cycle: CYCLE.YEARLY },
    { ID: 'mail-subscription', PeriodEnd: JAN_15_2027_NOON_UTC }
);

const passPlus = buildSubscription(
    { planName: PLANS.PASS, currency: 'EUR', cycle: CYCLE.MONTHLY },
    { ID: 'pass-subscription', PeriodEnd: MAR_20_2027_NOON_UTC }
);

const getEndingInDays = (days: number) => Math.floor(Date.now() / 1000) + days * 24 * 3600 + 3600;

const withSecondarySubscriptions = (subscription: Subscription, secondary: Subscription[]): Subscription => ({
    ...subscription,
    SecondarySubscriptions: secondary,
});

const renderCard = ({
    user,
    subscription,
    editBillingCycle = true,
    app = APPS.PROTONACCOUNT,
}: {
    user: TestPreloadedStateOverrides['user'];
    subscription?: Subscription;
    editBillingCycle?: boolean;
    app?: typeof APPS.PROTONACCOUNT | typeof APPS.PROTONMAIL;
}) =>
    renderWithProviders(<YourPlanSectionV2 app={app} editBillingCycle={editBillingCycle} />, {
        preloadedState: buildPreloadedState({ user, subscription }),
    });

const getPlanRows = () => screen.getAllByTestId('current-plan-subscription');

describe('YourPlanSectionV2', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONACCOUNT });
    });

    it('shows the free plan with split storage and the storage upsell for a free user', async () => {
        renderCard({ user: freeUser, subscription: freeSubscription, app: APPS.PROTONMAIL, editBillingCycle: false });

        const card = await screen.findByTestId('current-plan');
        expect(within(card).getByText('Proton Free')).toBeInTheDocument();
        expect(within(card).getByText('Mail storage used')).toBeInTheDocument();
        expect(within(card).getByText('0.00 GB of 1 GB')).toBeInTheDocument();
        expect(within(card).queryByText('Drive storage used')).not.toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Get more storage' })).toBeInTheDocument();
        expect(screen.queryByTestId('current-plan-subscription')).not.toBeInTheDocument();
        expect(screen.queryByTestId('reactivate-link')).not.toBeInTheDocument();
    });

    it('shows Pass Lifetime as the plan of a free Pass Lifetime user', async () => {
        renderCard({ user: { ...freeUser, ...passLifetime }, subscription: freeSubscription, editBillingCycle: false });

        const card = await screen.findByTestId('current-plan');
        expect(within(card).getByText('Pass + SimpleLogin Lifetime')).toBeInTheDocument();
        expect(within(card).queryByText('Proton Free')).not.toBeInTheDocument();
    });

    it('keeps the single-row layout for one subscription', async () => {
        renderCard({ user: paidUser, subscription: mailPlus });

        const card = await screen.findByTestId('current-plan');
        expect(within(card).getByText('Mail Plus')).toBeInTheDocument();
        expect(within(card).getByText('12 months')).toBeInTheDocument();
        expect(within(card).getByText('Next billing date')).toBeInTheDocument();
        expect(within(card).getByTestId('period-end')).toHaveTextContent('Jan 15, 2027');
        expect(within(card).getByText('Storage used')).toBeInTheDocument();
        expect(within(card).getByText('0.00 GB of 15 GB')).toBeInTheDocument();
        expect(within(card).getByTestId('edit-billing-details')).toHaveTextContent('Edit billing cycle');
        expect(screen.queryByTestId('current-plan-subscription')).not.toBeInTheDocument();
    });

    it('lists every subscription with its own cycle and renewal date, and shows account details once', async () => {
        renderCard({ user: paidUser, subscription: withSecondarySubscriptions(mailPlus, [passPlus]) });

        await screen.findByTestId('current-plan');
        const [mailRow, passRow] = getPlanRows();
        expect(getPlanRows()).toHaveLength(2);

        expect(within(mailRow).getByText('Mail Plus')).toBeInTheDocument();
        expect(within(mailRow).getByText('12 months')).toBeInTheDocument();
        expect(within(mailRow).getByTestId('period-end')).toHaveTextContent('Jan 15, 2027');
        expect(within(mailRow).queryByRole('button')).not.toBeInTheDocument();

        expect(within(passRow).getByText('Pass Plus')).toBeInTheDocument();
        expect(within(passRow).getByText('1 month')).toBeInTheDocument();
        expect(within(passRow).getByTestId('period-end')).toHaveTextContent('Mar 20, 2027');
        expect(within(passRow).queryByRole('button')).not.toBeInTheDocument();

        expect(screen.getAllByText('Storage used')).toHaveLength(1);
        expect(screen.getAllByText('0.00 GB of 15 GB')).toHaveLength(1);
        expect(screen.queryByTestId('edit-billing-details')).not.toBeInTheDocument();
        expect(screen.queryByText(/Manage subscription/)).not.toBeInTheDocument();
    });

    it('shows storage when any subscription includes mail storage, not only the first one', async () => {
        renderCard({ user: paidUser, subscription: withSecondarySubscriptions(passPlus, [mailPlus]) });

        await screen.findByTestId('current-plan');
        expect(screen.getAllByText('Storage used')).toHaveLength(1);
        expect(screen.getByText('0.00 GB of 15 GB')).toBeInTheDocument();
    });

    it('shows Pass Lifetime once when the user also has several subscriptions', async () => {
        renderCard({
            user: { ...paidUser, ...passLifetime },
            subscription: withSecondarySubscriptions(mailPlus, [passPlus]),
        });

        await screen.findByTestId('current-plan');
        const [mailRow, passRow] = getPlanRows();
        expect(within(mailRow).getByText('+ Pass + SimpleLogin Lifetime')).toBeInTheDocument();
        expect(within(passRow).queryByText('+ Pass + SimpleLogin Lifetime')).not.toBeInTheDocument();
    });

    it('shows one "Manage subscriptions" link, outside the rows, when billing cycle editing is off', async () => {
        renderCard({
            user: paidUser,
            subscription: withSecondarySubscriptions(mailPlus, [passPlus]),
            editBillingCycle: false,
        });

        const card = await screen.findByTestId('current-plan');
        const manageLinks = within(card).getAllByText(/Manage subscription/);
        expect(manageLinks).toHaveLength(1);
        expect(manageLinks[0]).toHaveTextContent(/^Manage subscriptions$/);
        expect(manageLinks[0].closest('a')).toHaveAttribute('href', expect.stringMatching(/\/subscription$/));
        getPlanRows().forEach((row) => expect(within(row).queryByText(/Manage subscription/)).not.toBeInTheDocument());
    });

    it('keeps the singular "Manage subscription" link for one subscription when billing cycle editing is off', async () => {
        renderCard({ user: paidUser, subscription: mailPlus, editBillingCycle: false });

        const card = await screen.findByTestId('current-plan');
        expect(within(card).getByText(/Manage subscription/)).toHaveTextContent(/^Manage subscription$/);
    });

    it('shows the ends banner of a non-renewing subscription with a link to the subscriptions table', async () => {
        const endingPassPlus: Subscription = {
            ...passPlus,
            Renew: Renew.Disabled,
            PeriodEnd: getEndingInDays(20),
        };

        renderCard({ user: paidUser, subscription: withSecondarySubscriptions(mailPlus, [endingPassPlus]) });

        expect(await screen.findByText('Pass Plus expires in 20 days.')).toBeInTheDocument();
        expect(screen.queryByText(/Mail Plus expires/)).not.toBeInTheDocument();
        expect(screen.getByTestId('reactivate-link')).toHaveAttribute(
            'href',
            '/dashboard?source=banners#your-subscriptions'
        );

        const [, passRow] = getPlanRows();
        expect(within(passRow).getByText('End date')).toBeInTheDocument();
    });

    it('shows one ends banner, for the subscription that ends soonest', async () => {
        const endingMailPlus: Subscription = { ...mailPlus, Renew: Renew.Disabled, PeriodEnd: getEndingInDays(20) };
        const endingPassPlus: Subscription = { ...passPlus, Renew: Renew.Disabled, PeriodEnd: getEndingInDays(10) };

        renderCard({ user: paidUser, subscription: withSecondarySubscriptions(endingMailPlus, [endingPassPlus]) });

        expect(await screen.findByText('Pass Plus expires in 10 days.')).toBeInTheDocument();
        expect(screen.queryByText(/Mail Plus expires/)).not.toBeInTheDocument();
        expect(screen.getAllByTestId('reactivate-link')).toHaveLength(1);
    });

    it('skips an ending trial for the ends banner, like the top banner', async () => {
        const endingMailPlus: Subscription = { ...mailPlus, Renew: Renew.Disabled, PeriodEnd: getEndingInDays(20) };
        const endingPassPlusTrial: Subscription = {
            ...passPlus,
            Renew: Renew.Disabled,
            PeriodEnd: getEndingInDays(10),
            IsTrial: true,
        };

        renderCard({ user: paidUser, subscription: withSecondarySubscriptions(endingMailPlus, [endingPassPlusTrial]) });

        expect(await screen.findByText('Mail Plus expires in 20 days.')).toBeInTheDocument();
        expect(screen.queryByText(/Pass Plus expires/)).not.toBeInTheDocument();
    });
});
