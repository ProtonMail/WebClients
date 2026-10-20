import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getOrganizationState } from '@proton/account/testing/redux-state';
import { getModelState } from '@proton/account/tests';
import { changeRenewState } from '@proton/payments/core/api/api';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { Renew } from '@proton/payments/core/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { apiMock } from '@proton/test-api/api';

import { renderWithProviders } from '../../../../testing/renderWithProviders';
import { organization } from '../__mocks__/data';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

jest.mock('@proton/atoms/Portal/Portal');

const userModel: UserModel = {
    ID: 'user-123',
} as UserModel;

const vpnSubscription = buildSubscription(PLANS.VPN2024);

const vpnBusinessSubscription = buildSubscription(PLANS.VPN_BUSINESS);

type HookRef = { hook?: ReturnType<typeof useCancelSubscriptionFlow> };
const Component = ({ hookRef }: { hookRef: HookRef }) => {
    const result = useCancelSubscriptionFlow({ app: APPS.PROTONMAIL });

    hookRef.hook = result;

    return result.cancelSubscriptionModals;
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
    it('should return subscription kept if free subscription', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(FREE_SUBSCRIPTION as unknown as Subscription),
                user: getModelState({ ...userModel }),
                organization: getOrganizationState(organization),
            },
        });

        await expect(hookRef.hook?.cancelSubscription({})).resolves.toEqual({
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

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({});

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

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({});

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

            const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({});

            await screen.findByTestId('cancelSubscription');
            await userEvent.click(screen.getByTestId('cancelSubscription'));
            await wait(0);

            await userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
            await userEvent.click(screen.getByText('I use a different Proton account'));
            await userEvent.click(screen.getByTestId('submitFeedback'));

            await wait(0);

            expect(apiMock).toHaveBeenCalledWith(
                changeRenewState({
                    RenewalState: Renew.Disabled,
                    CancellationFeedback: {
                        Reason: 'DIFFERENT_ACCOUNT',
                        Feedback: null,
                        ReasonDetails: null,
                        Context: 'mail',
                    },
                })
            );

            await expect(cancelSubscriptionPromise).resolves.toEqual({
                status: 'cancelled',
            });
        }
    );
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

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({});

        expect(await screen.findByText('Why would you like to cancel?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        await expect(cancelSubscriptionPromise).resolves.toEqual({ status: 'kept' });
        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'payments/v5/subscription' }));
    });
});
