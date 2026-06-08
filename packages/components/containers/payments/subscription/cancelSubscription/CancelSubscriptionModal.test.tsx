import { render } from '@testing-library/react';
import { addMonths, format, getUnixTime } from 'date-fns';

import { CYCLE, PLANS, type Subscription } from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders/subscription';

import { CancelSubscriptionModal } from './CancelSubscriptionModal';

jest.mock('@proton/components/components/portal/Portal');

const onResolve = jest.fn();
const onReject = jest.fn();

let mockSubscription: Subscription;

beforeEach(() => {
    mockSubscription = buildSubscription(
        {
            planName: PLANS.BUNDLE,
            currency: 'EUR',
            cycle: CYCLE.YEARLY,
        },
        {
            PeriodStart: 1685966060,
            PeriodEnd: 1717588460,
            CreateTime: 1685966060,
        }
    );
});

it('should render', () => {
    const { container } = render(
        <CancelSubscriptionModal subscription={mockSubscription} onResolve={onResolve} onReject={onReject} open />
    );
    expect(container).not.toBeEmptyDOMElement();
});

it('should return status kept when clicking on keep subscription', () => {
    const { getByTestId } = render(
        <CancelSubscriptionModal subscription={mockSubscription} onResolve={onResolve} onReject={onReject} open />
    );
    getByTestId('keepSubscription').click();
    expect(onResolve).toHaveBeenCalledWith({ status: 'kept' });
});

it('should return status cancelled when clicking on cancel subscription', () => {
    const { getByTestId } = render(
        <CancelSubscriptionModal subscription={mockSubscription} onResolve={onResolve} onReject={onReject} open />
    );
    getByTestId('cancelSubscription').click();
    expect(onResolve).toHaveBeenCalledWith({ status: 'cancelled' });
});

it('should display end date of the current subscription', () => {
    // We ensure to have a date in the future to avoid formatting errors
    const futureDate = addMonths(new Date(), 2);

    const adaptedSubscription = buildSubscription(undefined, {
        PeriodEnd: getUnixTime(futureDate),
    });

    const { container } = render(
        <CancelSubscriptionModal subscription={adaptedSubscription} onResolve={onResolve} onReject={onReject} open />
    );

    const expectedDate = format(futureDate, 'PPP');
    expect(container).toHaveTextContent(`expires on ${expectedDate}`);
});

it('should display the end date of the upcoming subscription if it exists', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    const upcomingPeriodEnd = new Date('2026-01-01T00:00:00.000Z');
    const withUpcoming = mockSubscription;
    withUpcoming.UpcomingSubscription = buildSubscription(
        {
            planName: PLANS.BUNDLE,
            currency: 'EUR',
            cycle: CYCLE.TWO_YEARS,
        },
        {
            PeriodStart: getUnixTime(new Date('2025-01-01T00:00:00.000Z')),
            PeriodEnd: getUnixTime(upcomingPeriodEnd),
            CreateTime: 1685966060,
        }
    );

    const { container } = render(
        <CancelSubscriptionModal subscription={withUpcoming} onResolve={onResolve} onReject={onReject} open />
    );

    expect(container).toHaveTextContent(`expires on ${format(upcomingPeriodEnd, 'PPP')}`);

    jest.useRealTimers();
});
