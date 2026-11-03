import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/testing/getModelState';
import { changeRenewState } from '@proton/payments/core/api/api';
import { FREE_SUBSCRIPTION, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';
import { apiMock } from '@proton/test-api/api';
import { useFlag } from '@proton/unleash/useFlag';

import useSettingsLink from '../../../../components/link/useSettingsLink';
import { renderWithProviders } from '../../../../testing/renderWithProviders';
import { CancellationReminderSection } from './CancellationReminderSection';

jest.mock('@proton/atoms/Portal/Portal');

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

jest.mock('@proton/shared/lib/vpn/vpnServers', () => ({
    VPN_SERVERS: { paid: { countries: 10 } },
}));

jest.mock('../../../../components/link/useSettingsLink');
const mockGoToSettings = jest.fn();
jest.mocked(useSettingsLink).mockReturnValue(mockGoToSettings);

const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const driveSubscription = { ...buildSubscription(PLANS.DRIVE), ID: 'sub-drive' };

const renderSection = (subscription: Subscription, initialUrl = '/cancel-subscription') => {
    return renderWithProviders(<CancellationReminderSection app={APPS.PROTONMAIL} />, {
        initialUrl,
        preloadedState: {
            user: getModelState(buildUser()),
            subscription: getSubscriptionState(subscription),
        },
    });
};

const getHeading = (plan: PLANS) => {
    return screen.queryByRole('heading', { name: `What you give up when you cancel ${PLAN_NAMES[plan]}` });
};

describe('Cancellation flow section', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseFlag.mockReturnValue(true);
    });

    it('Should render the CancellationReminderSection component', () => {
        renderSection(mailSubscription);

        expect(getHeading(PLANS.MAIL)).toBeInTheDocument();
    });

    it.each([PLANS.BUNDLE, PLANS.DRIVE, PLANS.BUNDLE_PRO_2024])(
        'Should adapt UI depending on the user plan',
        (plan) => {
            renderSection(buildSubscription(plan));

            expect(getHeading(plan)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Keep subscription' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel subscription' })).toBeInTheDocument();
        }
    );

    it('Should redirect to the dashboard for free users', () => {
        renderSection(FREE_SUBSCRIPTION as unknown as Subscription);

        expect(mockGoToSettings).toHaveBeenCalledWith('/dashboard');
    });

    describe('with several subscriptions', () => {
        const mailAndDrive = { ...mailSubscription, SecondarySubscriptions: [driveSubscription] };

        it('shows the subscription from the URL', () => {
            renderSection(mailAndDrive, '/cancel-subscription?subscriptionId=sub-drive');

            expect(getHeading(PLANS.DRIVE)).toBeInTheDocument();
            expect(getHeading(PLANS.MAIL)).not.toBeInTheDocument();
            expect(mockGoToSettings).not.toHaveBeenCalled();
        });

        it('redirects to the dashboard when the URL names no subscription', () => {
            renderSection(mailAndDrive);

            expect(mockGoToSettings).toHaveBeenCalledWith('/dashboard');
            expect(getHeading(PLANS.MAIL)).not.toBeInTheDocument();
        });

        it('redirects to the dashboard when the URL names an unknown subscription', () => {
            renderSection(mailAndDrive, '/cancel-subscription?subscriptionId=sub-unknown');

            expect(mockGoToSettings).toHaveBeenCalledWith('/dashboard');
        });

        it('cancels the subscription from the URL by its ID', async () => {
            mockUseFlag.mockReturnValue(false);
            const { container } = renderSection(mailAndDrive, '/cancel-subscription?subscriptionId=sub-drive');

            await userEvent.click(screen.getByTestId('cancellation-flow:confirm-cancellation'));
            await userEvent.click(screen.getByTestId('confirm-cancellation-button'));
            await userEvent.click(container.ownerDocument.querySelector('#reason') as HTMLButtonElement);
            await userEvent.click(screen.getByText('I use a different Proton account'));
            await userEvent.click(screen.getByTestId('submitFeedback'));
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
});
