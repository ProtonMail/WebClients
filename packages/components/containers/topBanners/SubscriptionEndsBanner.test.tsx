import { screen } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';

import { renderWithProviders } from '../../testing/renderWithProviders';
import SubscriptionEndsBanner from './SubscriptionEndsBanner';

jest.mock('../../hooks/useShowVPNDashboard', () => ({
    __esModule: true,
    default: () => ({ showVPNDashboard: false }),
}));

jest.mock('../../hooks/accounts/useShowDashboard', () => ({
    __esModule: true,
    default: () => ({ showDashboard: false }),
    useShowDriveDashboard: () => ({ showDashboard: false }),
}));

const JAN_16 = new Date('2026-01-16T12:00:00Z').getTime() / 1000;
const JAN_21 = new Date('2026-01-21T12:00:00Z').getTime() / 1000;

const ending = (plan: PLANS, PeriodEnd: number, override: Partial<Subscription> = {}) =>
    buildSubscription(plan, { ID: `${plan}-ending`, Renew: Renew.Disabled, PeriodEnd, ...override });

const renewing = (plan: PLANS, PeriodEnd: number) =>
    buildSubscription(plan, { ID: `${plan}-renewing`, Renew: Renew.Enabled, PeriodEnd });

const renderBanner = (subscriptions: Subscription[]) => {
    const [first, ...others] = subscriptions;
    return renderWithProviders(<SubscriptionEndsBanner app={APPS.PROTONACCOUNT} />, {
        preloadedState: {
            subscription: getSubscriptionState(first ? { ...first, SecondarySubscriptions: others } : undefined),
        },
    });
};

const reactivateHref = '/dashboard?source=banners#your-subscriptions';

describe('SubscriptionEndsBanner', () => {
    beforeAll(() => jest.useFakeTimers().setSystemTime(new Date('2026-01-01T12:00:00Z')));
    afterAll(() => jest.useRealTimers());

    it('names the subscription that ends soonest when two subscriptions end', () => {
        renderBanner([ending(PLANS.MAIL, JAN_21), ending(PLANS.DRIVE, JAN_16)]);

        expect(screen.getByText(/Subscription ending: Reactivate by/)).toHaveTextContent(
            'Subscription ending: Reactivate by January 16th, 2026 to keep your Drive Plus 200 GB benefits. Reactivate now'
        );
        expect(screen.getByTestId('reactivate-link')).toHaveAttribute('href', reactivateHref);
    });

    it('names the ending subscription when it is listed after a renewing one', () => {
        renderBanner([renewing(PLANS.MAIL, JAN_16), ending(PLANS.DRIVE, JAN_21)]);

        expect(screen.getByText(/Subscription ending: Reactivate by/)).toHaveTextContent(
            'Subscription ending: Reactivate by January 21st, 2026 to keep your Drive Plus 200 GB benefits. Reactivate now'
        );
    });

    it('names the ending paid subscription, not an ending trial that ends sooner', () => {
        renderBanner([ending(PLANS.PASS, JAN_16, { IsTrial: true }), ending(PLANS.MAIL, JAN_21)]);

        expect(screen.getByText(/Subscription ending: Reactivate by/)).toHaveTextContent(
            'Subscription ending: Reactivate by January 21st, 2026 to keep your Mail Plus benefits. Reactivate now'
        );
    });

    it.each([
        { name: 'a free user', subscriptions: [] },
        { name: 'only renewing subscriptions', subscriptions: [renewing(PLANS.MAIL, JAN_16)] },
        { name: 'only an ending trial', subscriptions: [ending(PLANS.PASS, JAN_16, { IsTrial: true })] },
    ] as const)('renders nothing for $name', ({ subscriptions }) => {
        renderBanner([...subscriptions]);

        expect(screen.queryByText(/Subscription ending/)).not.toBeInTheDocument();
        expect(screen.queryByTestId('reactivate-link')).not.toBeInTheDocument();
    });
});
