import { render } from '@testing-library/react';
import { addMonths, format, getUnixTime } from 'date-fns';

import { subscriptionMock, upcomingSubscriptionMock } from '@proton/testing/data';

import { CancelSubscriptionModal } from './CancelSubscriptionModal';

jest.mock('@proton/components/components/portal/Portal');

const onResolve = jest.fn();
const onReject = jest.fn();

it('should render', () => {
    const { container } = render(
        <CancelSubscriptionModal subscription={subscriptionMock} onResolve={onResolve} onReject={onReject} open />
    );
    expect(container).not.toBeEmptyDOMElement();
});

it('should return status kept when clicking on keep subscription', () => {
    const { getByTestId } = render(
        <CancelSubscriptionModal subscription={subscriptionMock} onResolve={onResolve} onReject={onReject} open />
    );
    getByTestId('keepSubscription').click();
    expect(onResolve).toHaveBeenCalledWith({ status: 'kept' });
});

it('should return status cancelled when clicking on cancel subscription', () => {
    const { getByTestId } = render(
        <CancelSubscriptionModal subscription={subscriptionMock} onResolve={onResolve} onReject={onReject} open />
    );
    getByTestId('cancelSubscription').click();
    expect(onResolve).toHaveBeenCalledWith({ status: 'cancelled' });
});

it('should display end date of the current subscription', () => {
    // We ensure to have a date in the future to avoid formatting errors
    const futureDate = addMonths(new Date(), 2);
    const adaptedSubscription = {
        ...subscriptionMock,
        PeriodEnd: getUnixTime(futureDate),
    };

    const { container } = render(
        <CancelSubscriptionModal subscription={adaptedSubscription} onResolve={onResolve} onReject={onReject} open />
    );

    const expectedDate = format(futureDate, 'PP');
    expect(container).toHaveTextContent(`expires on ${expectedDate}`);
});

it('should display the end date of the upcoming subscription if it exists', () => {
    const { container } = render(
        <CancelSubscriptionModal
            subscription={{ ...subscriptionMock, UpcomingSubscription: upcomingSubscriptionMock }}
            onResolve={onResolve}
            onReject={onReject}
            open
        />
    );

    expect(container).toHaveTextContent('expires on Jun 5, 2026');
});
