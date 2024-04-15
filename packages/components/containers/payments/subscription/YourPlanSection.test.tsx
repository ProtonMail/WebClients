import { fireEvent, render, waitFor, within } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import {
    useAddresses,
    useCache,
    useCalendars,
    useConfig,
    useFeature,
    useGetUserInvitations,
    useOrganization,
    usePendingUserInvitations,
    usePlans,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '@proton/components/hooks';
import { APPS, ORGANIZATION_STATE, PLANS } from '@proton/shared/lib/constants';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import YourPlanSection from './YourPlanSection';
import {
    addresses,
    calendars,
    organization,
    pendingInvite,
    plans,
    subscriptionBundle,
    subscriptionBusiness,
    user,
    vpnServersCount,
} from './__mocks__/data';
import { SUBSCRIPTION_STEPS } from './constants';

jest.mock('@proton/components/hooks/useConfig');
const mockUseConfig = useConfig as jest.MockedFunction<any>;
mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL });

jest.mock('@proton/components/hooks/useUser');
const mockUseUser = useUser as jest.MockedFunction<any>;
mockUseUser.mockReturnValue([user, false]);

jest.mock('@proton/components/hooks/usePlans');
const mockUsePlans = usePlans as jest.MockedFunction<any>;
mockUsePlans.mockReturnValue([{ plans, freePlan: FREE_PLAN }, false]);

jest.mock('@proton/components/hooks/useAddresses');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;
mockUseAddresses.mockReturnValue([addresses, false]);

jest.mock('@proton/components/hooks/useCalendars');
const mockUseCalendars = useCalendars as jest.MockedFunction<any>;
mockUseCalendars.mockReturnValue([calendars, false]);

jest.mock('@proton/components/hooks/useSubscription');
const mockUseSubscription = useSubscription as jest.MockedFunction<any>;
mockUseSubscription.mockReturnValue([subscriptionBundle, false]);

jest.mock('@proton/components/hooks/useOrganization');
const mockUseOrganization = useOrganization as jest.MockedFunction<any>;
mockUseOrganization.mockReturnValue([[], false]);

jest.mock('@proton/components/hooks/useVPNServersCount');
const mockUseVPNServersCount = useVPNServersCount as jest.MockedFunction<any>;
mockUseVPNServersCount.mockReturnValue([vpnServersCount, false]);

jest.mock('@proton/components/hooks/usePendingUserInvitations');
const mockUsePendingUserInvitations = usePendingUserInvitations as jest.MockedFunction<any>;
mockUsePendingUserInvitations.mockReturnValue([[], false]);
const mockUseGetPendingUserInvitations = useGetUserInvitations as jest.MockedFunction<any>;
mockUseGetPendingUserInvitations.mockReturnValue(async () => []);

jest.mock('@proton/components/hooks/useLoad');

const mockOpenSubscriptionModal = jest.fn();
jest.mock('./SubscriptionModalProvider', () => ({
    __esModule: true,
    useSubscriptionModal: () => [mockOpenSubscriptionModal],
}));

jest.mock('@proton/components/hooks/useFeature');
const mockUseFeature = useFeature as jest.MockedFunction<any>;
mockUseFeature.mockReturnValue({ feature: { Value: true } });

jest.mock('@proton/components/hooks/useCache');
const mockUseCache = useCache as jest.MockedFunction<any>;
mockUseCache.mockReturnValue({ get: jest.fn(), delete: jest.fn() });

describe('YourPlanSection', () => {
    beforeEach(() => {
        mockUseSubscription.mockReturnValue([subscriptionBundle, false]);
        mockUsePendingUserInvitations.mockReturnValue([[], false]);
        mockUseOrganization.mockReturnValue([{}, false]);
    });

    afterEach(() => {
        mockUsePendingUserInvitations.mockRestore();
        mockUseOrganization.mockRestore();
        mockUseSubscription.mockRestore();
    });

    describe('when user has no pending invite', () => {
        it('should only render subscription panel and upsell panels', async () => {
            const { getByTestId } = render(<YourPlanSection app={APPS.PROTONMAIL} />);

            const dashboardPanelsContainer = getByTestId('dashboard-panels-container');

            expect(dashboardPanelsContainer.childNodes).toHaveLength(2);
            const [subscriptionPanel, upsellPanel] = dashboardPanelsContainer.childNodes;

            // Subscription Panel
            expect(subscriptionPanel).toBeTruthy();
            within(subscriptionPanel as HTMLElement).getByText('Proton Unlimited');
            within(subscriptionPanel as HTMLElement).getByText('Edit billing cycle');
            within(subscriptionPanel as HTMLElement).getByText('Explore other Proton plans');

            // Upsell Panel
            expect(upsellPanel).toBeTruthy();
            within(upsellPanel as HTMLElement).getByText('Proton Family');
            const upsellButton = within(upsellPanel as HTMLElement).getByTestId('upsell-cta');
            fireEvent.click(upsellButton);

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            expect(mockOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: 24,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('when user has pending invites', () => {
        it('should render subscription panel and pending invites, without upsells', async () => {
            mockUsePendingUserInvitations.mockReturnValueOnce([[pendingInvite], false]);

            const { getByTestId } = render(<YourPlanSection app={APPS.PROTONMAIL} />);

            const dashboardPanelsContainer = getByTestId('dashboard-panels-container');

            expect(dashboardPanelsContainer.childNodes).toHaveLength(2);
            const [subscriptionPanel, invitePanel] = dashboardPanelsContainer.childNodes;

            // Subscription Panel
            expect(subscriptionPanel).toBeTruthy();
            within(subscriptionPanel as HTMLElement).getByText('Proton Unlimited');
            within(subscriptionPanel as HTMLElement).getByText('Edit billing cycle');
            within(subscriptionPanel as HTMLElement).getByText('Explore other Proton plans');

            // Upsell Panel
            expect(invitePanel).toBeTruthy();
            within(invitePanel as HTMLElement).getByText('Pending invitation');
            within(invitePanel as HTMLElement).getByText('Invitation from Test Org');
            within(invitePanel as HTMLElement).getByText('View invitation');
        });
    });

    describe('[business] when there is more than one user in organization', () => {
        it('should render subscription, usage and upsells', () => {
            mockUseOrganization.mockReturnValue([organization]);
            mockUseSubscription.mockReturnValue([subscriptionBusiness]);

            const { getByTestId } = renderWithProviders(<YourPlanSection app={APPS.PROTONMAIL} />);

            const dashboardPanelsContainer = getByTestId('dashboard-panels-container');

            expect(dashboardPanelsContainer.childNodes).toHaveLength(3);
            const [subscriptionPanel, usagePanel, upsellPanel] = dashboardPanelsContainer.childNodes;

            // Subscription Panel
            expect(subscriptionPanel).toBeTruthy();
            within(subscriptionPanel as HTMLElement).getByText('Proton Pro');

            // Upsell Panel
            expect(upsellPanel).toBeTruthy();
            within(upsellPanel as HTMLElement).getByText('Business');

            // Usage Panel
            expect(usagePanel).toBeTruthy();
            within(usagePanel as HTMLElement).getByText("Your account's usage");
        });

        it('should render subscription, upsells but not usage when organisation is locked', () => {
            mockUseOrganization.mockReturnValue([{ ...organization, State: ORGANIZATION_STATE.DELINQUENT }]);
            mockUseSubscription.mockReturnValue([subscriptionBusiness]);

            const { getByTestId } = renderWithProviders(<YourPlanSection app={APPS.PROTONMAIL} />);

            const dashboardPanelsContainer = getByTestId('dashboard-panels-container');

            expect(dashboardPanelsContainer.childNodes).toHaveLength(2);
            const [subscriptionPanel, upsellPanel] = dashboardPanelsContainer.childNodes;

            // Subscription Panel
            expect(subscriptionPanel).toBeTruthy();
            within(subscriptionPanel as HTMLElement).getByText('Proton Pro');

            // Upsell Panel
            expect(upsellPanel).toBeTruthy();
            within(upsellPanel as HTMLElement).getByText('Business');
        });
    });
});
