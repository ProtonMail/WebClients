import { render } from '@testing-library/react';

import { mockSubscriptionCache, mockUserCache, userDefaultResponse } from '@proton/components/hooks/helpers/test';
import { PLANS } from '@proton/shared/lib/constants';
import { External, Subscription, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/models/userModel';
import { applyHOCs, withApi, withCache } from '@proton/testing/index';

import CreditsSection from './CreditsSection';

let subscription: SubscriptionModel;
let upcoming: Subscription | null = null;
let user: any;

jest.mock('@proton/components/components/portal/Portal');

const ContextCreditsSection = applyHOCs(withApi(), withCache())(CreditsSection);

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

    user = {
        ...userDefaultResponse,
    };
    user.User.Credit = 11988; // credit to buy the upcoming subscription
    mockUserCache(formatUser(user.User));
    mockSubscriptionCache(subscription);
});

it('should render', () => {
    const { container } = render(<ContextCreditsSection />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should display the number of available credits', () => {
    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('avalaible-credits')).toHaveTextContent('119.88');
});

it('should render 0 credits if the amount of credits is the same as upcoming subscription price', () => {
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('avalaible-credits')).toHaveTextContent('0');
});

it('should render positive amount of credits if there are more credits than upcoming subscription price', () => {
    user.User.Credit = 12988;
    mockUserCache(formatUser(user.User));
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('avalaible-credits')).toHaveTextContent('10');
});

it('should render 0 if the number of available credits is less than price of upcoming subscription', () => {
    user.User.Credit = 10000;
    mockUserCache(formatUser(user.User));
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('avalaible-credits')).toHaveTextContent('0');
});

it('should render credits as-is if subscription is managed by Chargebee', () => {
    subscription.External = External.Chargebee;
    subscription.UpcomingSubscription = upcoming;
    subscription.UpcomingSubscription!.External = External.Chargebee;
    user.User.Credit = 12988;
    mockUserCache(formatUser(user.User));

    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('avalaible-credits')).toHaveTextContent('129.88');
});

it('should display loader if subscription is not available', () => {
    mockSubscriptionCache(null as any);
    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('circle-loader')).toBeInTheDocument();
});

it('should take into account discount', () => {
    subscription.UpcomingSubscription = upcoming;
    subscription.UpcomingSubscription!.Discount = 1988;
    const { getByTestId } = render(<ContextCreditsSection />);
    expect(getByTestId('avalaible-credits')).toHaveTextContent('19.88');
});
