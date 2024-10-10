import { screen } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import { useSubscription } from '@proton/components/hooks';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { PLANS, PLAN_NAMES, PLAN_TYPES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { CancellationReminderSection } from './CancellationReminderSection';
import useCancellationFlow from './useCancellationFlow';

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;
jest.mock('@proton/components/hooks/useSubscription');
const mockUseSubscription = useSubscription as jest.MockedFunction<any>;
jest.mock('@proton/components/hooks/useVPNServersCount');
const mockUseVPNServersCount = useVPNServersCount as jest.MockedFunction<any>;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

jest.mock('./useCancellationFlow');
const mockUseCancellationFlow = useCancellationFlow as jest.Mock;

const defaultUser = {
    ChargebeeUser: 2,
};

const defaultB2CSubscription = {
    Plans: [
        {
            MaxAddresses: 5,
            MaxDomains: 1,
            Name: PLANS.MAIL,
            Type: PLAN_TYPES.PLAN,
        },
    ],
};

describe('Cancellation flow section', () => {
    beforeEach(() => {
        mockUseCancellationFlow.mockImplementation(() => {
            const originalModule = jest.requireActual('./useCancellationFlow');
            return originalModule.default();
        });

        // We want to enable the feature everywhere
        mockUseFlag.mockReturnValue(true);
        // We don't want to test the VPN count in the tests
        mockUseVPNServersCount.mockReturnValue([{ paid: { countries: 10 } }]);
    });

    it('Should render the CancellationReminderSection component', () => {
        mockUseUser.mockReturnValue([defaultUser, false]);
        mockUseSubscription.mockReturnValue([defaultB2CSubscription, false]);

        renderWithProviders(<CancellationReminderSection app={APPS.PROTONMAIL} />);
        expect(
            screen.getByRole('heading', { name: `What you give up when you cancel ${PLAN_NAMES[PLANS.MAIL]}` })
        ).toBeInTheDocument();
    });

    it.each([
        [PLANS.BUNDLE, PLAN_NAMES[PLANS.BUNDLE]],
        [PLANS.DRIVE, PLAN_NAMES[PLANS.DRIVE]],
        [PLANS.BUNDLE_PRO_2024, PLAN_NAMES[PLANS.BUNDLE_PRO_2024]],
    ])('Should adapt UI depending on the user plan', (plan, planName) => {
        mockUseUser.mockReturnValue([defaultUser, false]);
        mockUseSubscription.mockReturnValue([
            {
                Plans: [
                    {
                        MaxAddresses: 5,
                        MaxCalendars: 10,
                        MaxDomains: 10,
                        Name: plan,
                        Type: PLAN_TYPES.PLAN,
                    },
                ],
            },
            false,
        ]);

        renderWithProviders(<CancellationReminderSection app={APPS.PROTONMAIL} />);

        expect(
            screen.getByRole('heading', { name: `What you give up when you cancel ${planName}` })
        ).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Keep subscription' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel subscription' })).toBeInTheDocument();
    });

    it('Should redirect to the dashboard for free users', () => {
        mockUseUser.mockReturnValue([{}, false]);
        mockUseSubscription.mockReturnValue([{}, false]);

        const spyRedirectDashboard = jest.fn();
        mockUseCancellationFlow.mockReturnValue({
            b2bAccess: false,
            b2cAccess: false,
            redirectToDashboard: spyRedirectDashboard,
        });

        renderWithProviders(<CancellationReminderSection app={APPS.PROTONMAIL} />);
        expect(spyRedirectDashboard).toHaveBeenCalled();
    });
});
