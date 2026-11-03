import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/testing/getModelState';
import { getOrganizationState } from '@proton/account/testing/redux-state';
import { changeRenewState } from '@proton/payments/core/api/api';
import { FREE_SUBSCRIPTION, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { apiMock } from '@proton/test-api/api';

import { renderWithProviders } from '../../../../testing/renderWithProviders';
import NotificationsChildren from '../../../notifications/Children';
import { organization } from '../__mocks__/data';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

jest.mock('@proton/atoms/Portal/Portal');

const userModel: UserModel = {
    ID: 'user-123',
} as UserModel;

const vpnSubscription = { ...buildSubscription(PLANS.VPN2024), ID: 'sub-vpn' };

const vpnBusinessSubscription = { ...buildSubscription(PLANS.VPN_BUSINESS), ID: 'sub-vpn-business' };

const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };

const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

const differentAccountFeedback = {
    RenewalState: Renew.Disabled,
    CancellationFeedback: {
        Reason: 'DIFFERENT_ACCOUNT',
        Feedback: null,
        ReasonDetails: null,
        Context: 'mail',
    },
} as const;

type HookRef = { hook?: ReturnType<typeof useCancelSubscriptionFlow> };
const Component = ({ hookRef }: { hookRef: HookRef }) => {
    const result = useCancelSubscriptionFlow({ app: APPS.PROTONMAIL });

    hookRef.hook = result;

    return (
        <>
            {result.cancelSubscriptionModals}
            <NotificationsChildren />
        </>
    );
};

const setup = ({
    preloadedState,
}: {
    preloadedState: NonNullable<Parameters<typeof renderWithProviders>[1]>['preloadedState'];
}) => {
    const hookRef: HookRef = {};
    const view = renderWithProviders(<Component hookRef={hookRef} />, {
        preloadedState: preloadedState,
    });
    return { hookRef, result: view };
};

describe('cancel subscription', () => {
    it('should keep the subscription and tell the user when the given subscription is free', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(FREE_SUBSCRIPTION as unknown as Subscription),
                user: getModelState({ ...userModel }),
                organization: getOrganizationState(organization),
            },
        });

        await expect(hookRef.hook?.cancelSubscription({ subscription: FREE_SUBSCRIPTION })).resolves.toEqual({
            status: 'kept',
        });
        expect(await screen.findByText('You already have a free account')).toBeInTheDocument();
        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'put' }));
    });

    it('should return subscription kept if the subscription is no longer there', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(FREE_SUBSCRIPTION as unknown as Subscription),
                user: getModelState({ ...userModel }),
                organization: getOrganizationState(organization),
            },
        });

        await expect(hookRef.hook?.cancelSubscription({ subscription: vpnSubscription })).resolves.toEqual({
            status: 'kept',
        });
    });

    it('should return subscription kept if user closes the modal', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(vpnSubscription),
                user: getModelState({ ...userModel }),
                organization: getOrganizationState(organization),
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({ subscription: vpnSubscription });

        await screen.findByTestId('keepSubscription');
        await userEvent.click(screen.getByTestId('keepSubscription'));

        await expect(cancelSubscriptionPromise).resolves.toEqual({
            status: 'kept',
        });
    });

    it('should return subscription kept if user closes the feedback modal', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(vpnSubscription),
                user: getModelState({ ...userModel }),
                organization: getOrganizationState(organization),
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({ subscription: vpnSubscription });

        await screen.findByTestId('cancelSubscription');
        await userEvent.click(screen.getByTestId('cancelSubscription'));
        await wait(0);
        // Simulate user clicking the element to close the feedback modal
        await userEvent.click(screen.getByTestId('cancelFeedback'));

        await expect(cancelSubscriptionPromise).resolves.toEqual({
            status: 'kept',
        });
    });

    it.each([PLANS.VPN2024, PLANS.PASS, PLANS.VPN_PASS_BUNDLE, PLANS.MAIL_PRO])(
        'should send the API request for subscription cancellation and return the result: %s',
        async (plan) => {
            const subscription = {
                ...vpnSubscription,
                Plans: [
                    {
                        ...vpnSubscription.Plans[0],
                        Name: plan,
                    },
                ],
            };

            const {
                hookRef,
                result: { container },
            } = setup({
                preloadedState: {
                    subscription: getSubscriptionState(subscription),
                    user: getModelState({ ...userModel }),
                    organization: getOrganizationState(organization),
                },
            });

            const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({ subscription });

            await screen.findByTestId('cancelSubscription');
            await userEvent.click(screen.getByTestId('cancelSubscription'));
            await wait(0);

            await userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
            await userEvent.click(screen.getByText('I use a different Proton account'));
            await userEvent.click(screen.getByTestId('submitFeedback'));

            await wait(0);

            expect(apiMock).toHaveBeenCalledWith(changeRenewState(differentAccountFeedback, 'sub-vpn'));

            await expect(cancelSubscriptionPromise).resolves.toEqual({
                status: 'cancelled',
            });
        }
    );
});

describe('cancelling one of several subscriptions', () => {
    const preloadedState = {
        subscription: getSubscriptionState({ ...mailSubscription, SecondarySubscriptions: [lumoSubscription] }),
        user: getModelState({ ...userModel }),
        organization: getOrganizationState(organization),
    };

    it('runs every step for the given subscription and cancels it by its ID', async () => {
        const {
            hookRef,
            result: { container },
        } = setup({ preloadedState });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({ subscription: lumoSubscription });

        expect(
            await screen.findByText(`You will lose access to ${PLAN_NAMES[PLANS.LUMO]} features on this date.`)
        ).toBeInTheDocument();
        await userEvent.click(screen.getByTestId('cancelSubscription'));
        await wait(0);
        await userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
        await userEvent.click(screen.getByText('I use a different Proton account'));
        await userEvent.click(screen.getByTestId('submitFeedback'));
        await wait(0);

        expect(apiMock).toHaveBeenCalledWith(changeRenewState(differentAccountFeedback, 'sub-lumo'));
        expect(apiMock).not.toHaveBeenCalledWith(changeRenewState(differentAccountFeedback, 'sub-mail'));
        await expect(cancelSubscriptionPromise).resolves.toEqual({ status: 'cancelled' });
    });

    it('re-reads the given subscription, not the other one', async () => {
        const { hookRef } = setup({
            preloadedState: {
                ...preloadedState,
                subscription: getSubscriptionState({
                    ...mailSubscription,
                    SecondarySubscriptions: [{ ...lumoSubscription, Renew: Renew.Disabled }],
                }),
            },
        });

        await expect(hookRef.hook?.cancelSubscription({ subscription: lumoSubscription })).resolves.toEqual({
            status: 'kept',
        });
        expect(screen.queryByTestId('cancelSubscription')).not.toBeInTheDocument();
    });
});

describe('subscription cancellable only via support', () => {
    it('should show the contact us modal and keep the subscription without calling the API', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(vpnBusinessSubscription),
                user: getModelState({ ...userModel }),
                organization: getOrganizationState(organization),
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({ subscription: vpnBusinessSubscription });

        expect(await screen.findByText('Why would you like to cancel?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        await expect(cancelSubscriptionPromise).resolves.toEqual({ status: 'kept' });
        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'payments/v5/subscription' }));
    });
});
