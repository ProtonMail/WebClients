import { getModelState } from '@proton/account/test';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import { userDefault } from '@proton/components/hooks/helpers/test';
import { PLANS } from '@proton/payments';
import type { Subscription, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { BillingPlatform } from '@proton/shared/lib/interfaces';
import { applyHOCs, getSubscriptionState, withApi, withCache } from '@proton/testing';

import CreditsSection from './CreditsSection';

let subscription: SubscriptionModel;
let upcoming: Subscription | null = null;
let user: typeof userDefault;

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
        RenewDiscount: 0,
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
                Offer: 'default',
                Quantity: 1,
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
        RenewDiscount: 0,
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
                Offer: 'default',
            },
        ],
        Renew: 1,
        External: 0,
    };

    jest.clearAllMocks();

    user = {
        ...userDefault,
    };
    user.Credit = 11988; // credit to buy the upcoming subscription
});

it('should render', () => {
    const { container } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(container).not.toBeEmptyDOMElement();
});

it('should display the number of available credits', () => {
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('avalaible-credits')).toHaveTextContent('119.88');
});

it('should render 0 credits if the amount of credits is the same as upcoming subscription price', () => {
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('avalaible-credits')).toHaveTextContent('0');
});

it('should render positive amount of credits if there are more credits than upcoming subscription price', () => {
    user.Credit = 12988;
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('avalaible-credits')).toHaveTextContent('10');
});

it('should render 0 if the number of available credits is less than price of upcoming subscription', () => {
    user.Credit = 10000;
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('avalaible-credits')).toHaveTextContent('0');
});

it('should render credits as-is if subscription is managed by Chargebee', () => {
    subscription.BillingPlatform = BillingPlatform.Chargebee;
    subscription.UpcomingSubscription = upcoming;
    subscription.UpcomingSubscription!.BillingPlatform = BillingPlatform.Chargebee;
    user.Credit = 12988;

    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('avalaible-credits')).toHaveTextContent('129.88');
});

it('should display loader if subscription is not available', () => {
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(null as any),
        },
    });
    expect(getByTestId('circle-loader')).toBeInTheDocument();
});

it('should take into account discount', () => {
    subscription.UpcomingSubscription = upcoming;
    subscription.UpcomingSubscription!.Discount = 1988;
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription as any),
        },
    });
    expect(getByTestId('avalaible-credits')).toHaveTextContent('19.88');
});
