import { render, screen } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
import type { GroupMembershipReturn } from '@proton/shared/lib/interfaces/GroupMember';

import GroupMembershipSection from './GroupMembershipSection';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/account/groupMemberships/hooks', () => ({
    useGroupMemberships: jest.fn(),
}));

jest.mock('./GroupActions', () => () => null);
jest.mock('./GroupState', () => () => null);

const membership: GroupMembershipReturn = {
    GroupID: 'group-id',
    ID: 'membership-id',
    AddressID: 'address-id',
    State: 1,
    ForwardingKeys: { PrivateKey: '', ActivationToken: '' },
    Permissions: 0,
    Group: { Name: 'Sales', Address: 'sales@example.com' },
};

const renderSection = ({
    organizationPlans,
    loadingEntitlements = false,
}: {
    organizationPlans: CataloguedPlan[];
    loadingEntitlements?: boolean;
}) => {
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans: [], organizationPlans }),
        loadingEntitlements,
    ]);
    jest.mocked(useGroupMemberships).mockReturnValue([[membership], false]);
    render(<GroupMembershipSection />);
};

describe('GroupMembershipSection', () => {
    it('shows the group address to a member of an organization with group mail', () => {
        renderSection({ organizationPlans: [PLANS.VISIONARY] });

        expect(screen.getByText('Sales')).toBeInTheDocument();
        expect(screen.getByText('sales@example.com')).toBeInTheDocument();
    });

    it('hides the group address in an organization without mail', () => {
        renderSection({ organizationPlans: [PLANS.DRIVE_BUSINESS] });

        expect(screen.getByText('Sales')).toBeInTheDocument();
        expect(screen.queryByText('sales@example.com')).not.toBeInTheDocument();
    });

    it('shows no groups while entitlements load', () => {
        renderSection({ organizationPlans: [PLANS.VISIONARY], loadingEntitlements: true });

        expect(screen.queryByText('Sales')).not.toBeInTheDocument();
    });
});
