import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import { organization, vpnServersCount } from '@proton/components/containers/payments/subscription/__mocks__/data';
import { useVPNServersCount } from '@proton/components/hooks';
import { changeRenewState, deleteSubscription } from '@proton/shared/lib/api/payments';
import { APPS, FREE_SUBSCRIPTION, PLANS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled, Renew } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { PLANS_MAP, subscriptionMock } from '@proton/testing/data';
import { apiMock } from '@proton/testing/lib/api';
import { getOrganizationState, getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

jest.mock('@proton/components/components/portal/Portal');

jest.mock('@proton/components/hooks/useVPNServersCount');
const mockUseVPNServersCount = useVPNServersCount as jest.MockedFunction<any>;
mockUseVPNServersCount.mockReturnValue([vpnServersCount, false]);

const userModel: UserModel = {
    ID: 'user-123',
} as UserModel;

const vpnSubscription: SubscriptionModel = {
    ...subscriptionMock,
    Plans: [
        {
            ...subscriptionMock.Plans[0],
            Name: PLANS.VPN,
        },
    ],
};

const mailSubscription: SubscriptionModel = {
    ...subscriptionMock,
    Plans: [
        {
            ...subscriptionMock.Plans[0],
            Name: PLANS.MAIL_PRO,
        },
    ],
};

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
    const result = renderWithProviders(<Component hookRef={hookRef} />, {
        preloadedState: preloadedState,
    });
    return { hookRef, result };
};

describe('cancel subscription', () => {
    it('should return subscription kept if free subscription', async () => {
        const { hookRef } = setup({
            preloadedState: {
                subscription: getSubscriptionState(FREE_SUBSCRIPTION as unknown as SubscriptionModel),
                user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
                organization: getOrganizationState(organization),
            },
        });

        await expect(hookRef.hook?.cancelSubscription()).resolves.toEqual({
            status: 'kept',
        });
    });

    it('should return subscription kept if user closes the modal', async () => {
        const {
            hookRef,
            result: { getByTestId },
        } = setup({
            preloadedState: {
                subscription: getSubscriptionState(vpnSubscription),
                user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
                organization: getOrganizationState(organization),
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription();

        await screen.findByTestId('keepSubscription');
        await userEvent.click(getByTestId('keepSubscription'));

        await expect(cancelSubscriptionPromise).resolves.toEqual({
            status: 'kept',
        });
    });

    it('should return subscription kept if user closes the feedback modal', async () => {
        const {
            hookRef,
            result: { getByTestId },
        } = setup({
            preloadedState: {
                subscription: getSubscriptionState(vpnSubscription),
                user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
                organization: getOrganizationState(organization),
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription();

        await screen.findByTestId('cancelSubscription');
        await userEvent.click(getByTestId('cancelSubscription'));
        await wait(0);
        // Simulate user clicking the element to close the feedback modal
        await userEvent.click(getByTestId('cancelFeedback'));

        await expect(cancelSubscriptionPromise).resolves.toEqual({
            status: 'kept',
        });
    });

    it.each([PLANS.VPN, PLANS.VPN2024, PLANS.PASS, PLANS.VPN_PASS_BUNDLE])(
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
                result: { getByTestId, container, getByText },
            } = setup({
                preloadedState: {
                    subscription: getSubscriptionState(subscription),
                    user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
                    organization: getOrganizationState(organization),
                },
            });

            const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription();

            await screen.findByTestId('cancelSubscription');
            await userEvent.click(getByTestId('cancelSubscription'));
            await wait(0);

            await userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
            await userEvent.click(getByText('I use a different Proton account'));
            await userEvent.click(getByTestId('submitFeedback'));

            await wait(0);

            expect(apiMock).toHaveBeenCalledWith(
                changeRenewState(
                    {
                        RenewalState: Renew.Disabled,
                        CancellationFeedback: {
                            Reason: 'DIFFERENT_ACCOUNT',
                            Feedback: '',
                            ReasonDetails: '',
                            Context: 'mail',
                        },
                    },
                    'v5'
                )
            );

            await expect(cancelSubscriptionPromise).resolves.toEqual({
                status: 'cancelled',
            });
        }
    );
});

describe('downgrade subscription', () => {
    it('should downgrade a mail subscription', async () => {
        const {
            hookRef,
            result: { getByTestId, container, getByText },
        } = setup({
            preloadedState: {
                subscription: getSubscriptionState(mailSubscription),
                user: getModelState({ ...userModel, hasPaidMail: true, Subscribed: PRODUCT_BIT.MAIL }),
                organization: getOrganizationState(organization),
                plans: {
                    ...getModelState({ plans: Object.values(PLANS_MAP), freePlan: FREE_PLAN }),
                    meta: { fetchedAt: Date.now(), fetchedEphemeral: true },
                },
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription();

        await screen.findByTestId('highlight-downgrade-to-free');
        await userEvent.click(getByTestId('highlight-downgrade-to-free'));

        await wait(0);
        await userEvent.type(container.querySelector('#confirm-text')!, organization.Name);
        await userEvent.click(getByTestId('confirm-member-delete'));
        await wait(0);
        await userEvent.click(getByTestId('confirm-downgrade-btn'));
        await wait(0);
        await userEvent.click(getByTestId('highlight-downgrade-to-free'));
        await wait(0);
        await userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
        await userEvent.click(getByText('I use a different Proton account'));
        await userEvent.click(getByTestId('submitFeedback'));

        expect(apiMock).toHaveBeenCalledWith(
            deleteSubscription(
                {
                    Reason: 'DIFFERENT_ACCOUNT',
                    Feedback: '',
                    ReasonDetails: '',
                    Context: 'mail',
                },
                'v5'
            )
        );
        await expect(cancelSubscriptionPromise).resolves.toEqual({ status: 'downgraded' });
    });
});
