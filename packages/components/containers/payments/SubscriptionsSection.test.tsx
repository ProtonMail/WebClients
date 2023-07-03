import { render } from '@testing-library/react';

import {
    defaultSubscriptionCache,
    mockPlansCache,
    mockSubscriptionCache,
    mockUserCache,
    plansDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import { PLANS } from '@proton/shared/lib/constants';
import { External, Renew, Subscription, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { applyHOCs, withApi, withCache, withEventManager } from '@proton/testing/index';

import SubscriptionsSection from './SubscriptionsSection';

const ContextSubscriptionSection = applyHOCs(withEventManager(), withApi(), withCache())(SubscriptionsSection);

describe('SubscriptionsSection', () => {
    let subscription: SubscriptionModel;
    let upcoming: Subscription | null = null;

    beforeEach(() => {
        subscription = {
            ...defaultSubscriptionCache,
        };

        upcoming = {
            ID: 'otn4BE2IqNdCc7EBbk2RRgWcz7MM9uND1crSP6JEr77_NQFaFH4cpTd-hUPhfS6AfEqYHEJAmQTlqGVIGHhu6g==',
            InvoiceID: 'rUznuSfHQUAWn1-Su6KrQaptDCsOBzrINayg3j8MZ55-BrWXg5gghfiYCRWdvdobFbp5PZa-FfHC04boZv39Zg==',
            Cycle: 24,
            PeriodStart: 1671640027,
            PeriodEnd: 1734798427,
            CreateTime: 1669119757,
            CouponCode: 'BUNDLE',
            Currency: 'CHF',
            Amount: 499,
            Discount: 0,
            External: External.Default,
            RenewAmount: 8376,
            Plans: [
                {
                    ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
                    Type: 1,
                    Name: PLANS.MAIL,
                    Title: 'Mail Plus',
                    MaxDomains: 1,
                    MaxAddresses: 10,
                    MaxCalendars: 25,
                    MaxSpace: 16106127360,
                    MaxMembers: 1,
                    MaxVPN: 0,
                    MaxTier: 0,
                    Services: 1,
                    Features: 1,
                    State: 1,
                    Cycle: 24,
                    Currency: 'CHF',
                    Amount: 8376,
                    Quantity: 1,
                    Pricing: {
                        '1': 1199,
                        '12': 11988,
                        '24': 19176,
                    },
                    Offers: [],
                },
            ],
            Renew: 1,
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
        const { container } = render(<ContextSubscriptionSection />);

        expect(container).toHaveTextContent('Proton Unlimited*');
        expect(container).toHaveTextContent('119.88');
        expect(container).toHaveTextContent('Active');

        expect(container).not.toHaveTextContent('Upcoming');
    });

    it('should display Expiring badge if renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { container } = render(<ContextSubscriptionSection />);

        expect(container).toHaveTextContent('Proton Unlimited');
        expect(container).toHaveTextContent('119.88');
        expect(container).toHaveTextContent('Expiring');
    });

    it('should not render asterisk if Renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).not.toHaveTextContent('*');
    });

    it('should render current upcoming subscription', () => {
        subscription.UpcomingSubscription = upcoming;

        const { container } = render(<ContextSubscriptionSection />);

        expect(container).toHaveTextContent('Proton Unlimited');
        expect(container).toHaveTextContent('119.88');
        expect(container).toHaveTextContent('Active');

        expect(container).toHaveTextContent('Mail Plus*');
        expect(container).toHaveTextContent('83.76');
        expect(container).toHaveTextContent('Upcoming');
    });

    it('should not render asterisk for upcoming subscription if Renew is disabled', () => {
        subscription.UpcomingSubscription = upcoming;
        subscription.Renew = Renew.Disabled;

        const { container } = render(<ContextSubscriptionSection />);
        expect(container).not.toHaveTextContent('*');
    });

    it('should show renewal date as end of the current subscription if there is no upcoming one', () => {
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).toHaveTextContent('* Renews automatically on Feb 10, 2024');
    });

    it('should NOT show renewal date if Renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).not.toHaveTextContent('Renews automatically on Feb 10, 2024');
    });

    it('should show renewal date as end of the upcoming subscription if there is one', () => {
        subscription.UpcomingSubscription = upcoming;
        const { container } = render(<ContextSubscriptionSection />);
        expect(container).toHaveTextContent('* Renews automatically on Dec 21, 2024');
    });

    it('should display Manage button when Renew is enabled', () => {
        const { getByText } = render(<ContextSubscriptionSection />);
        expect(getByText('Manage')).toBeInTheDocument();
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

    /**
     * Even if the current plan has an increased price, the user should see the price of the current subscription.
     */
    it('should display price based on the current subscription, not plans', () => {
        const changedPricePlan = {
            ID: 'tHdKCeJlgD7mv_W13BqEZeelMiptPIK6r8arzZFcQcLvBLNiogdGOGVyYOldyhzcnSzCPkvkWj-VtyDwSjIncg==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'bundle2022',
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
            Pricing: {
                '1': 1299,
                '12': 15588,
                '24': 31176,
            },
            DefaultPricing: {
                '1': 1299,
                '12': 15588,
                '24': 31176,
            },
            PeriodEnd: {
                '1': 1691058163,
                '12': 1720002163,
                '24': 1751538163,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [
                {
                    Name: 'pricechange2023',
                    StartTime: 1688385600,
                    EndTime: null,
                    Pricing: {
                        '1': 1299,
                        '12': 15588,
                        '24': 31176,
                    },
                },
            ],
            Cycle: 1,
            Amount: 1299,
            Vendors: {
                Google: {
                    Plans: {
                        '12': 'giapaccount_bundle2022_12_renewing',
                    },
                    CustomerID: 'cus_google_Ga0hQ_smHZjsi1F87zvm',
                },
                Apple: {
                    Plans: {
                        '12': 'iosaccount_bundle2022_12_usd_non_renewing',
                    },
                    CustomerID: '',
                },
            },
        };

        const plansCache = [...plansDefaultResponse.Plans].filter((it) => it.Name !== changedPricePlan.Name);
        plansCache.push(changedPricePlan);

        mockPlansCache(plansCache);

        const { container } = render(<ContextSubscriptionSection />);
        expect(container).toHaveTextContent('Proton Unlimited*');
        expect(container).toHaveTextContent('119.88');
        expect(container).not.toHaveTextContent('155.88'); // 12 month price from the Plan
    });
});
