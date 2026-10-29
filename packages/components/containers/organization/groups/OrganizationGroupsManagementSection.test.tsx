import { render } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { groupOwnerInvitesThunk } from '@proton/account/groupOwnerInvites';
import { PLANS } from '@proton/payments/core/constants';
import { buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrantsForTesting';

import OrganizationGroupsManagementSection from './OrganizationGroupsManagementSection';
import { useGroupsManagement } from './context/GroupsManagementContext';
import { GROUPS_RESTRICTION_REASON } from './types';

const mockDispatch = jest.fn(() => Promise.resolve());

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));
jest.mock('@proton/account/groupOwnerInvites', () => ({
    groupOwnerInvitesThunk: jest.fn(() => 'groupOwnerInvitesThunk'),
}));
jest.mock('@proton/account/userPermissions/hooks', () => ({
    AdminRolesUIState: { Enabled: 'enabled', Disabled: 'disabled' },
    useAdminRolesUI: () => ['disabled'],
}));
jest.mock('@proton/features/useFeature', () => () => ({ feature: undefined, update: jest.fn(), loading: false }));
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => mockDispatch }));
jest.mock('../../payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModal: () => [jest.fn(), false],
}));
jest.mock('./context/GroupsManagementContext', () => ({
    useGroupsManagement: jest.fn(),
    withGroupsManagementContext: (Component: any) => Component,
}));
jest.mock('./components/GroupsMemberManagementPanel', () => () => null);
jest.mock('../ScimSetupBannerAndModal', () => () => null);
jest.mock('../../members/rolesAndPermissions/RoleAssignmentPausedBanner', () => () => null);
jest.mock('../../members/rolesAndPermissions/AdminRolesOnboardingModal', () => () => null);

describe('OrganizationGroupsManagementSection group owner invites', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('dispatches the group owner invites thunk on mount (the thunk decides whether to fetch)', () => {
        jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
            buildOrgAndUserEntitlementChecks({ subscriptionPlans: [PLANS.PASS_BUSINESS] }),
            false,
        ]);
        jest.mocked(useGroupsManagement).mockReturnValue({
            groups: [],
            actions: {},
            restrictedBy: { reason: GROUPS_RESTRICTION_REASON.NONE },
        } as unknown as ReturnType<typeof useGroupsManagement>);

        render(<OrganizationGroupsManagementSection />);

        expect(groupOwnerInvitesThunk).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith('groupOwnerInvitesThunk');
    });
});
