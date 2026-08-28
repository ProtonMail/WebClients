import { getModelState } from '@proton/account/tests';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import { buildSubscription } from '@proton/testing/builders/subscription';
import { applyHOCs } from '@proton/testing/lib/context/hocs/helpers';
import { withApi } from '@proton/testing/lib/context/hocs/with-api';
import { withCache } from '@proton/testing/lib/context/hocs/with-cache';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';
import { getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import { userDefault } from '../../hooks/helpers/tests/index';
import CreditsSection from './CreditsSection';

let subscription: Subscription;
let upcoming: Subscription | null = null;
let user: typeof userDefault;

jest.mock('@proton/atoms/Portal/Portal');

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
    const { container } = renderWithProviders(<ContextCreditsSection app={APPS.PROTONMAIL} />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(container).not.toBeEmptyDOMElement();
});

it('should display the number of available credits', () => {
    const { getByTestId } = renderWithProviders(<ContextCreditsSection app={APPS.PROTONMAIL} />, {
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
    const { getByTestId } = renderWithProviders(<ContextCreditsSection app={APPS.PROTONMAIL} />, {
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

    const { getByTestId } = renderWithProviders(<ContextCreditsSection app={APPS.PROTONMAIL} />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription),
        },
    });
    expect(getByTestId('available-credits')).toHaveTextContent('129.88');
});

it('should display loader if subscription is not available', () => {
    const { getByTestId } = renderWithProviders(<ContextCreditsSection app={APPS.PROTONMAIL} />, {
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
    const { getByTestId } = renderWithProviders(<ContextCreditsSection app={APPS.PROTONMAIL} />, {
        preloadedState: {
            user: getModelState(user),
            subscription: getSubscriptionState(subscription as any),
        },
    });
    expect(getByTestId('available-credits')).toHaveTextContent('19.88');
});
