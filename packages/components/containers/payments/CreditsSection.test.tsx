import { getModelState } from '@proton/account/test';
import { userDefault } from '@proton/components/hooks/helpers/test';
import { BillingPlatform, CYCLE, PLANS, type Subscription } from '@proton/payments';
import { renderWithProviders } from '@proton/testing';
import { applyHOCs, getSubscriptionState, withApi, withCache } from '@proton/testing';
import { buildSubscription } from '@proton/testing/builders';

import CreditsSection from './CreditsSection';

let subscription: Subscription;
let upcoming: Subscription | null = null;
let user: typeof userDefault;

jest.mock('@proton/components/components/portal/Portal');

const ContextCreditsSection = applyHOCs(withApi(), withCache())(CreditsSection);

beforeEach(() => {
    subscription = buildSubscription({
        planName: PLANS.BUNDLE,
        currency: 'CHF',
        cycle: CYCLE.MONTHLY,
    });

    upcoming = buildSubscription({
        planName: PLANS.BUNDLE,
        currency: 'CHF',
        cycle: CYCLE.YEARLY,
    });

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
    expect(getByTestId('available-credits')).toHaveTextContent('119.88');
});

it('should render 0 credits if the amount of credits is the same as upcoming subscription price', () => {
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('available-credits')).toHaveTextContent('0');
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
    expect(getByTestId('available-credits')).toHaveTextContent('10');
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
    expect(getByTestId('available-credits')).toHaveTextContent('0');
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
    expect(getByTestId('available-credits')).toHaveTextContent('129.88');
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
    expect(getByTestId('available-credits')).toHaveTextContent('19.88');
});
