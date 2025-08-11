import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import { organization, vpnServersCount } from '@proton/components/containers/payments/subscription/__mocks__/data';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import {
    FREE_PLAN,
    FREE_SUBSCRIPTION,
    PLANS,
    Renew,
    type Subscription,
    changeRenewState,
    deleteSubscription,
} from '@proton/payments';
import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { renderWithProviders } from '@proton/testing';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';
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

const vpnSubscription = buildSubscription(PLANS.VPN2024);

const mailProSubscription = buildSubscription(PLANS.MAIL_PRO);

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
                user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
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
                user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
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
                user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
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

    it.each([PLANS.VPN2024, PLANS.PASS, PLANS.VPN_PASS_BUNDLE])(
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
                    user: getModelState({ ...userModel, ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED }),
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
            result: { container },
        } = setup({
            preloadedState: {
                subscription: getSubscriptionState(mailProSubscription),
                user: getModelState({ ...userModel, hasPaidMail: true, Subscribed: PRODUCT_BIT.MAIL }),
                organization: getOrganizationState(organization),
                plans: {
                    ...getModelState({ plans: Object.values(PLANS_MAP), freePlan: FREE_PLAN }),
                    meta: { fetchedAt: Date.now(), fetchedEphemeral: true },
                },
            },
        });

        const cancelSubscriptionPromise = hookRef.hook?.cancelSubscription({});

        await screen.findByTestId('highlight-downgrade-to-free');
        await userEvent.click(screen.getByTestId('highlight-downgrade-to-free'));

        await wait(0);
        await userEvent.type(container.querySelector('#confirm-text')!, organization.Name);
        await userEvent.click(screen.getByTestId('confirm-member-delete'));
        await wait(0);
        await userEvent.click(screen.getByTestId('confirm-downgrade-btn'));
        await wait(0);
        await userEvent.click(screen.getByTestId('highlight-downgrade-to-free'));
        await wait(0);
        await userEvent.click(container.querySelector('#reason') as HTMLButtonElement);
        await userEvent.click(screen.getByText('I use a different Proton account'));
        await userEvent.click(screen.getByTestId('submitFeedback'));

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
