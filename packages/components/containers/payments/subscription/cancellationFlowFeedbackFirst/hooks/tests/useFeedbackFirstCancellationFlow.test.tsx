import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/testing/getModelState';
import { changeRenewState } from '@proton/payments/core/api/api';
import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';
import { apiMock } from '@proton/test-api/api';

import { renderWithProviders } from '../../../../../../testing/renderWithProviders';
import { useFeedbackFirstCancellationFlow } from '../useFeedbackFirstCancellationFlow';

jest.mock('@proton/atoms/Portal/Portal');

const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const driveSubscription = { ...buildSubscription(PLANS.DRIVE), ID: 'sub-drive' };

interface Props {
    subscription: Subscription;
}

const FeedbackFirstFlow = ({ subscription }: Props) => {
    const { startFlow, modals } = useFeedbackFirstCancellationFlow(subscription);

    return (
        <>
            <button type="button" onClick={startFlow}>
                Start
            </button>
            {modals}
        </>
    );
};

describe('useFeedbackFirstCancellationFlow', () => {
    it('runs the flow for the given subscription and cancels it by its ID', async () => {
        const { container } = renderWithProviders(<FeedbackFirstFlow subscription={driveSubscription} />, {
            preloadedState: {
                user: getModelState(buildUser()),
                plans: getModelState({ plans: getTestPlans(), freePlan: FREE_PLAN }),
                subscription: getSubscriptionState({
                    ...mailSubscription,
                    SecondarySubscriptions: [driveSubscription],
                }),
            },
        });

        await userEvent.click(screen.getByRole('button', { name: 'Start' }));
        await userEvent.click(container.ownerDocument.querySelector('#reason') as HTMLButtonElement);
        await userEvent.click(screen.getByText('I use a different Proton account'));
        await userEvent.click(screen.getByTestId('submitFeedback'));

        expect(await screen.findByText('What changes if you switch to the Free plan')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Continue cancelling' }));
        await userEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));
        await wait(0);

        expect(apiMock).toHaveBeenCalledWith(
            changeRenewState(
                {
                    RenewalState: Renew.Disabled,
                    CancellationFeedback: {
                        Reason: 'DIFFERENT_ACCOUNT',
                        Feedback: null,
                        ReasonDetails: null,
                        Context: 'mail',
                    },
                },
                'sub-drive'
            )
        );
    });
});
