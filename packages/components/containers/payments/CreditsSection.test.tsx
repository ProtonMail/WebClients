import { getModelState } from '@proton/account/test';
import { userDefault } from '@proton/components/hooks/helpers/test';
import { CYCLE, PLANS, type Subscription } from '@proton/payments';
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

it('should render positive amount of credits if there are more credits than upcoming subscription price', () => {
    user.Credit = 12988;
    subscription.UpcomingSubscription = upcoming;
    const { getByTestId } = renderWithProviders(<ContextCreditsSection />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('available-credits')).toHaveTextContent('129.88');
});

it('should render credits as-is if subscription is managed by Chargebee', () => {
    subscription.UpcomingSubscription = upcoming;
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
