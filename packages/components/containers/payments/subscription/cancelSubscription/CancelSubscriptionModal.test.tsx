import { render } from '@testing-library/react';

import { subscriptionMock } from '@proton/testing/data';

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
