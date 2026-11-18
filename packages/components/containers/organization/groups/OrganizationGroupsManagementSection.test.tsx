import { render } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { groupOwnerInvitesThunk } from '@proton/account/groupOwnerInvites';
import { PLANS } from '@proton/payments/core/constants';
import { buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrantsForTesting';

import OrganizationGroupsManagementSection from './OrganizationGroupsManagementSection';
import { useGroupsManagement } from './context/GroupsManagementContext';
import { GROUPS_RESTRICTION_REASON } from './types';

const mockDispatch = vi.fn(() => Promise.resolve());

vi.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: vi.fn(),
}));
vi.mock('@proton/account/groupOwnerInvites', () => ({
    groupOwnerInvitesThunk: vi.fn(() => 'groupOwnerInvitesThunk'),
}));
vi.mock('@proton/account/userPermissions/hooks', () => ({
    AdminRolesUIState: { Enabled: 'enabled', Disabled: 'disabled' },
    useAdminRolesUI: () => ['disabled'],
    useCanUpdateBilling: () => [true, false],
}));
vi.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: () => ({ feature: undefined, update: vi.fn(), loading: false }),
}));
vi.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => mockDispatch }));
vi.mock('../../payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModal: () => [vi.fn(), false],
}));
vi.mock('./context/GroupsManagementContext', () => ({
    useGroupsManagement: vi.fn(),
    withGroupsManagementContext: (Component: any) => Component,
}));
vi.mock('./components/GroupsMemberManagementPanel', () => ({ __esModule: true, default: () => null }));
vi.mock('../ScimSetupBannerAndModal', () => ({ __esModule: true, default: () => null }));
vi.mock('../../members/rolesAndPermissions/RoleAssignmentPausedBanner', () => ({
    __esModule: true,
    default: () => null,
}));
vi.mock('../../members/rolesAndPermissions/AdminRolesOnboardingModal', () => ({
    __esModule: true,
    default: () => null,
}));

describe('OrganizationGroupsManagementSection group owner invites', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dispatches the group owner invites thunk on mount (the thunk decides whether to fetch)', () => {
        vi.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
            buildOrgAndUserEntitlementChecks({ subscriptionPlans: [PLANS.PASS_BUSINESS] }),
            false,
        ]);
        vi.mocked(useGroupsManagement).mockReturnValue({
            groups: [],
            actions: {},
            restrictedBy: { reason: GROUPS_RESTRICTION_REASON.NONE },
        } as unknown as ReturnType<typeof useGroupsManagement>);

        render(<OrganizationGroupsManagementSection />);

        expect(groupOwnerInvitesThunk).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith('groupOwnerInvitesThunk');
    });
});
