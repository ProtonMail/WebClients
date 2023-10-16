import { render } from '@testing-library/react';

import { mockPlansCache, mockSubscriptionCache, mockUserCache } from '@proton/components/hooks/helpers/test';
import { changeRenewState } from '@proton/shared/lib/api/payments';
import { PLANS } from '@proton/shared/lib/constants';
import { Renew, Subscription, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { apiMock, applyHOCs, withApi, withCache, withEventManager } from '@proton/testing/index';

import SubscriptionsSection from './SubscriptionsSection';

const ContextSubscriptionSection = applyHOCs(withEventManager(), withApi(), withCache())(SubscriptionsSection);

describe('SubscriptionsSection', () => {
    let subscription: SubscriptionModel;
    let upcoming: Subscription | null = null;

    beforeEach(() => {
        subscription = {
            ID: '123',
            InvoiceID: '1234',
            Cycle: 1,
            PeriodStart: 1696561158,
            PeriodEnd: 1699239558,
            CreateTime: 1696561161,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 1299,
            Discount: 0,
            RenewAmount: 1299,
            Plans: [
                {
                    ID: '1',
                    Type: 1,
                    Name: PLANS.BUNDLE,
                    Title: 'Proton Unlimited',
                    MaxDomains: 3,
                    MaxAddresses: 15,
                    MaxCalendars: 25,
                    MaxSpace: 536870912000,
                    MaxMembers: 1,
                    MaxVPN: 10,
                    MaxTier: 2,
                    Services: 15,
                    Features: 1,
                    State: 1,
                    Cycle: 1,
                    Currency: 'CHF',
                    Amount: 1299,
                    Offers: [],
                    Quantity: 1,
                    Pricing: {
                        1: 1299,
                        12: 11988,
                        24: 19176,
                    },
                },
            ],
            Renew: 1,
            External: 0,
            UpcomingSubscription: null,
            isManagedByMozilla: false,
        };

        upcoming = {
            ID: '124',
            InvoiceID: null as any,
            Cycle: 12,
            PeriodStart: 1699239558,
            PeriodEnd: 1730861958,
            CreateTime: 1696561195,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 11988,
            Discount: 0,
            RenewAmount: 11988,
            Plans: [
                {
                    ID: '1',
                    Type: 1,
                    Name: PLANS.BUNDLE,
                    Title: 'Proton Unlimited',
                    MaxDomains: 3,
                    MaxAddresses: 15,
                    MaxCalendars: 25,
                    MaxSpace: 536870912000,
                    MaxMembers: 1,
                    MaxVPN: 10,
                    MaxTier: 2,
                    Services: 15,
                    Features: 1,
                    State: 1,
                    Cycle: 12,
                    Currency: 'CHF',
                    Amount: 11988,
                    Quantity: 1,
                    Offers: [],
                    Pricing: {
                        1: 1299,
                        12: 11988,
                        24: 19176,
                    },
                },
            ],
            Renew: 1,
            External: 0,
        };

        jest.clearAllMocks();

        mockUserCache();
        mockPlansCache();
        mockSubscriptionCache(subscription);
    });

    it('should return MozillaInfoPanel if isManagedByMozilla is true', () => {
        subscription.isManagedByMozilla = true;
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).toHaveTextContent('Your subscription is managed by Mozilla');
    });

    it('should render current subscription', () => {
        const { getByTestId } = render(<ContextSubscriptionSection />);

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('Nov 6, 2023');
    });

    it('should display Expiring badge if renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { getByTestId } = render(<ContextSubscriptionSection />);

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Expiring');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('Nov 6, 2023');
    });

    it('should render end date of upcoming subscription', () => {
        subscription.UpcomingSubscription = upcoming;

        const { getByTestId } = render(<ContextSubscriptionSection />);

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('Nov 6, 2024');
    });

    it('should show renewal notice if there is no upcoming subscription', () => {
        const { getByTestId } = render(<ContextSubscriptionSection />);
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 12.99, for 1 month');
    });

    it('should show renewal notice if there is upcoming subscription', () => {
        subscription.UpcomingSubscription = upcoming;
        const { getByTestId } = render(<ContextSubscriptionSection />);
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 119.88, for 12 months');
    });

    it('should now show renewal notice if subscription is expiring', () => {
        subscription.Renew = Renew.Disabled;
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).not.toHaveTextContent('Renews automatically');
    });

    it('should display Reactivate button when Renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { getByText } = render(<ContextSubscriptionSection />);
        expect(getByText('Reactivate')).toBeInTheDocument();
    });

    it('should display warning icon when renewal is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { queryByTestId } = render(<ContextSubscriptionSection />);
        expect(queryByTestId('periodEndWarning')).toBeInTheDocument();
    });

    it('should not display date of upcoming subscription if renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        subscription.UpcomingSubscription = upcoming;
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).not.toHaveTextContent('Upcoming');
    });

    it('should call API when user presses reactivate button', () => {
        subscription.Renew = Renew.Disabled;
        const { getByText } = render(<ContextSubscriptionSection />);
        getByText('Reactivate').click();
        expect(apiMock).toHaveBeenCalledWith(
            changeRenewState({
                RenewalState: Renew.Enabled,
            })
        );
    });
});
