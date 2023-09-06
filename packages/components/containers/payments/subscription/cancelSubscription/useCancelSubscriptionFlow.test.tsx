import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import { wait } from '@testing-library/user-event/dist/utils';

import { changeRenewState } from '@proton/shared/lib/api/payments';
import { Renew, SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';
import {
    componentWrapper as _componentWrapper,
    apiMock,
    hookWrapper,
    subscriptionMock,
    withApi,
    withConfig,
    withEventManager,
    withNotifications,
} from '@proton/testing';

import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

jest.mock('@proton/components/components/portal/Portal');

const user: UserModel = {
    ID: 'user-123',
} as UserModel;

const providers = [withConfig(), withApi(), withEventManager(), withNotifications()];
const wrapper = hookWrapper(...providers);
const componentWrapper = _componentWrapper(...providers);

it('should return modals and cancelSubscription', () => {
    const { result } = renderHook(
        () => useCancelSubscriptionFlow({ subscription: subscriptionMock as SubscriptionModel, user }),
        { wrapper }
    );

    expect(result.current.cancelSubscription).toBeDefined();
    expect(result.current.cancelSubscriptionModals).toBeDefined();
});

it('should return subscription kept if no subscription', async () => {
    const { result } = renderHook(() => useCancelSubscriptionFlow({ subscription: undefined as any, user }), {
        wrapper,
    });

    await expect(result.current.cancelSubscription()).resolves.toEqual({
        status: 'kept',
    });
});

it('should return subscription kept if no user', async () => {
    const { result } = renderHook(
        () =>
            useCancelSubscriptionFlow({ subscription: subscriptionMock as SubscriptionModel, user: undefined as any }),
        { wrapper }
    );

    await expect(result.current.cancelSubscription()).resolves.toEqual({
        status: 'kept',
    });
});

it('should return subscription kept if user closes the modal', async () => {
    const { result } = renderHook(
        () => useCancelSubscriptionFlow({ subscription: subscriptionMock as SubscriptionModel, user }),
        { wrapper }
    );

    const cancelSubscriptionPromise = result.current.cancelSubscription();

    const { getByTestId } = render(result.current.cancelSubscriptionModals);

    getByTestId('keepSubscription').click();

    await expect(cancelSubscriptionPromise).resolves.toEqual({
        status: 'kept',
    });
});

it('should return subscription kept if user closes the feedback modal', async () => {
    const { result } = renderHook(
        () => useCancelSubscriptionFlow({ subscription: subscriptionMock as SubscriptionModel, user }),
        { wrapper }
    );

    const cancelSubscriptionPromise = result.current.cancelSubscription();

    // Render the modal components returned by the hook
    const { getByTestId, rerender } = render(result.current.cancelSubscriptionModals, {
        wrapper: componentWrapper,
    });
    getByTestId('cancelSubscription').click();
    await wait(0);
    rerender(result.current.cancelSubscriptionModals);

    // Simulate user clicking the element to close the feedback modal
    getByTestId('cancelFeedback').click();

    await expect(cancelSubscriptionPromise).resolves.toEqual({
        status: 'kept',
    });
});

it('should send the API request for subscription cancellation and return the result', async () => {
    const { result } = renderHook(
        () => useCancelSubscriptionFlow({ subscription: subscriptionMock as SubscriptionModel, user }),
        { wrapper }
    );

    const cancelSubscriptionPromise = result.current.cancelSubscription();

    const { getByTestId, rerender, container, getByText } = render(result.current.cancelSubscriptionModals, {
        wrapper: componentWrapper,
    });
    getByTestId('cancelSubscription').click();
    await wait(0);
    rerender(result.current.cancelSubscriptionModals);

    userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
    userEvent.click(getByText('I use a different Proton account'));
    getByTestId('submitFeedback').click();

    await wait(0);
    rerender(result.current.cancelSubscriptionModals);

    expect(apiMock).toHaveBeenCalledWith(
        changeRenewState({
            RenewalState: Renew.Disabled,
            CancellationFeedback: {
                Reason: 'DIFFERENT_ACCOUNT',
                Feedback: '',
                ReasonDetails: '',
                Context: 'mail',
            },
        })
    );

    await expect(cancelSubscriptionPromise).resolves.toEqual({
        status: 'cancelled',
    });
});
