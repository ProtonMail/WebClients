import { getModelState } from '@proton/account/test';
import { plansDefaultResponse } from '@proton/components/hooks/helpers/test';
import { changeRenewState } from '@proton/payments/core/api/api';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { Renew, TrialType } from '@proton/payments/core/subscription/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/testing/builders/subscription';
import { apiMock } from '@proton/testing/lib/api';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';
import { getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import SubscriptionsSection from './SubscriptionsSection';

const mockGetPaymentMethods = jest.fn();
jest.mock('@proton/account/paymentMethods/hooks', () => ({
    useGetPaymentMethods: () => mockGetPaymentMethods,
}));

describe('SubscriptionsSection', () => {
    let subscription: Subscription;
    let yearlySub: Subscription;
    let upcoming: Subscription | null = null;
    let upcomingYearlySub: Subscription;

    beforeEach(() => {
        subscription = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                currency: 'CHF',
                cycle: CYCLE.MONTHLY,
            },
            {
                PeriodStart: 1696561158,
                PeriodEnd: 1699239558,
                CreateTime: 1696561161,
            }
        );

        upcoming = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                currency: 'CHF',
                cycle: CYCLE.YEARLY,
            },
            {
                PeriodStart: 1699239558,
                PeriodEnd: 1730861958,
                CreateTime: 1696561195,
            }
        );

        yearlySub = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                currency: 'CHF',
                cycle: CYCLE.YEARLY,
            },
            {
                PeriodStart: 1696561158,
                PeriodEnd: 1728097158,
                CreateTime: 1696561161,
            }
        );

        upcomingYearlySub = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                currency: 'CHF',
                cycle: CYCLE.YEARLY,
            },
            {
                PeriodStart: 1728097158,
                PeriodEnd: 1759633158,
                CreateTime: 1728097161,
            }
        );

        jest.clearAllMocks();
        mockGetPaymentMethods.mockResolvedValue([{ ID: 'pm1' }]);
    });

    const defaultPlansState = {
        ...getModelState({ plans: plansDefaultResponse.Plans, freePlan: FREE_PLAN }),
        meta: { fetchedAt: Date.now(), fetchedEphemeral: true },
    };

    it('should render current subscription', () => {
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('November 6th, 2023');
    });

    it('should display Expiring badge if renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Expiring');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('November 6th, 2023');
    });

    it('should render end date of upcoming subscription for same plan same cycle renewal', () => {
        yearlySub.UpcomingSubscription = upcomingYearlySub;

        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(yearlySub),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('October 5th, 2025');
    });

    it('should render end date of upcoming subscription', () => {
        subscription.UpcomingSubscription = upcoming;

        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('November 6th, 2024');
    });

    it('should show renewal notice if there is no upcoming subscription', () => {
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 12.99, for 1 month');
    });

    it('should show renewal notice if there is upcoming subscription', () => {
        subscription.UpcomingSubscription = upcoming;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 119.88, for 12 months');
    });

    it('should show renewal notice if there is upcoming subscription for same plan same cycle', () => {
        // Mimic a 30% off coupon on the BaseRenewAmount
        upcomingYearlySub.RenewAmount = upcomingYearlySub.BaseRenewAmount * 0.7;

        yearlySub.UpcomingSubscription = upcomingYearlySub;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(yearlySub),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 119.88, for 12 months');
    });

    it('should show renewal notice with 0 amount if there is upcoming subscription for same plan same cycle', () => {
        // Mimic a 100% off coupon on the BaseRenewAmount
        upcomingYearlySub.RenewAmount = 0;

        yearlySub.UpcomingSubscription = upcomingYearlySub;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(yearlySub),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 0, for 12 months');
    });

    it('should show the discounted renew amount when upcoming subscription has a different cycle', () => {
        // The upcoming yearly subscription carries a coupon discount on its RenewAmount.
        // Because the current subscription is monthly (different cycle), this is NOT a same plan same cycle
        // retention renewal, so we must display the actual discounted RenewAmount, not the BaseRenewAmount.
        upcoming!.RenewAmount = 8000;
        upcoming!.BaseRenewAmount = 11988;

        subscription.UpcomingSubscription = upcoming;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 80, for 12 months');
    });

    it('should show the discounted renew amount when upcoming subscription has a different plan', () => {
        // The upcoming subscription is for a different plan than the current one (same cycle), so it is not a
        // same plan same cycle retention renewal. The actual discounted RenewAmount must be displayed.
        const upcomingDifferentPlan = buildSubscription(
            {
                planName: PLANS.MAIL,
                currency: 'CHF',
                cycle: CYCLE.MONTHLY,
            },
            {
                RenewAmount: 8000,
                BaseRenewAmount: 11988,
                PeriodStart: 1699239558,
                PeriodEnd: 1701831558,
                CreateTime: 1696561195,
            }
        );

        subscription.UpcomingSubscription = upcomingDifferentPlan;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 80, for 1 month');
    });

    it('should now show renewal notice if subscription is expiring', () => {
        subscription.Renew = Renew.Disabled;
        const { container } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(container).not.toHaveTextContent('Renews automatically');
    });

    it('should display Reactivate button when Renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { getByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByText('Reactivate')).toBeInTheDocument();
    });

    it('should display warning icon when renewal is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { queryByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(queryByTestId('periodEndWarning')).toBeInTheDocument();
    });

    it('should not display date of upcoming subscription if renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        subscription.UpcomingSubscription = upcoming;
        const { container } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(container).not.toHaveTextContent('Upcoming');
    });

    it('should call API when user presses reactivate button', async () => {
        subscription.Renew = Renew.Disabled;

        const { getByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        getByText('Reactivate').click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockGetPaymentMethods).toHaveBeenCalled();
        expect(apiMock).toHaveBeenCalledWith(
            changeRenewState({
                RenewalState: Renew.Enabled,
            })
        );
    });

    it('should not call API when user presses reactivate button for referral trial without payment methods', async () => {
        subscription.Renew = Renew.Disabled;
        subscription.TrialType = TrialType.ReferralProgram;
        subscription.IsTrial = true;
        mockGetPaymentMethods.mockResolvedValue([]);

        const { getByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        getByText('Reactivate').click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockGetPaymentMethods).toHaveBeenCalled();
        expect(apiMock).not.toHaveBeenCalled();
    });
});
