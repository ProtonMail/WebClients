import { act, render, screen } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import type { GroupMembershipReturn } from '@proton/shared/lib/interfaces/GroupMember';

import GroupMembershipSection from './GroupMembershipSection';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/account/groupMemberships/hooks', () => ({
    useGroupMemberships: jest.fn(),
}));

// A button per row; keyed by status so that accepting replaces it, like the real actions do
jest.mock(
    './GroupActions',
    () =>
        ({ membership }: { membership: { Name: string; Status: string } }) =>
            require('react').createElement('button', { key: membership.Status }, `Act on ${membership.Name}`)
);
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
    subscriptionPlans,
    loadingEntitlements = false,
    memberships = [membership],
}: {
    subscriptionPlans: CataloguedPlan[];
    loadingEntitlements?: boolean;
    memberships?: GroupMembershipReturn[];
}) => {
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...organizationMember }),
        loadingEntitlements,
    ]);
    jest.mocked(useGroupMemberships).mockReturnValue([memberships, false]);
    render(<GroupMembershipSection />);
};

describe('GroupMembershipSection', () => {
    it('shows the group address to a member of an organization with group mail', () => {
        renderSection({ subscriptionPlans: [PLANS.VISIONARY] });

        expect(screen.getByText('Sales')).toBeInTheDocument();
        expect(screen.getByText('sales@example.com')).toBeInTheDocument();
    });

    it('hides the group address in an organization without mail', () => {
        renderSection({ subscriptionPlans: [PLANS.DRIVE_BUSINESS] });

        expect(screen.getByText('Sales')).toBeInTheDocument();
        expect(screen.queryByText('sales@example.com')).not.toBeInTheDocument();
    });

    it('shows no groups while entitlements load', () => {
        renderSection({ subscriptionPlans: [PLANS.VISIONARY], loadingEntitlements: true });

        expect(screen.queryByText('Sales')).not.toBeInTheDocument();
        expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    it('lists invitations first, then groups by address', () => {
        const getMembership = (ID: string, Name: string, Address: string, State: number) => ({
            ...membership,
            ID,
            State,
            Group: { Name, Address },
        });
        renderSection({
            subscriptionPlans: [PLANS.VISIONARY],
            memberships: [
                getMembership('1', 'Support', 'support@example.com', 1),
                getMembership('2', 'Marketing', 'marketing@example.com', 1),
                getMembership('3', 'Sales', 'sales@example.com', 0),
            ],
        });

        const rows = screen.getAllByRole('row').slice(1); // Skip the header row

        expect(rows.map((row) => row.textContent)).toEqual([
            expect.stringContaining('Sales'),
            expect.stringContaining('Marketing'),
            expect.stringContaining('Support'),
        ]);
    });

    it('shows an empty state without groups', () => {
        renderSection({ subscriptionPlans: [PLANS.VISIONARY], memberships: [] });

        expect(
            screen.getByText('You are not currently in any groups and there are no pending invitations')
        ).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    describe('focus', () => {
        const getMembership = (ID: string, Name: string, State: number) => ({
            ...membership,
            ID,
            State,
            Group: { Name, Address: `${Name.toLowerCase()}@example.com` },
        });
        const sales = getMembership('1', 'Sales', 0);
        const support = getMembership('2', 'Support', 1);

        const renderWith = (memberships: GroupMembershipReturn[]) => {
            jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
                buildOrgAndUserEntitlementChecks({ subscriptionPlans: [PLANS.VISIONARY], ...organizationMember }),
                false,
            ]);
            jest.mocked(useGroupMemberships).mockReturnValue([memberships, false]);
            return render(<GroupMembershipSection />);
        };

        it('moves focus to the next row when the focused row is removed', () => {
            const { rerender } = renderWith([sales, support]);
            screen.getByRole('button', { name: 'Act on Sales' }).focus();

            jest.mocked(useGroupMemberships).mockReturnValue([[support], false]);
            rerender(<GroupMembershipSection />);

            expect(screen.getByRole('button', { name: 'Act on Support' })).toHaveFocus();
        });

        it('keeps focus in the row when its actions are replaced', () => {
            const { rerender } = renderWith([sales, support]);
            screen.getByRole('button', { name: 'Act on Sales' }).focus();

            jest.mocked(useGroupMemberships).mockReturnValue([[{ ...sales, State: 1 }, support], false]);
            rerender(<GroupMembershipSection />);

            expect(screen.getByRole('button', { name: 'Act on Sales' })).toHaveFocus();
        });

        it('does not pull focus back after the user clicked away', async () => {
            const { rerender } = renderWith([sales, support]);
            const salesButton = screen.getByRole('button', { name: 'Act on Sales' });
            salesButton.focus();
            // Clicking the page background: focus goes to the body, with no related target
            salesButton.blur();
            await act(() => new Promise((resolve) => setTimeout(resolve)));

            // An unrelated update to the list, e.g. from the event loop
            jest.mocked(useGroupMemberships).mockReturnValue([[sales, { ...support, State: 0 }], false]);
            rerender(<GroupMembershipSection />);

            expect(document.body).toHaveFocus();
        });

        it('restores focus only once', () => {
            const { rerender } = renderWith([sales, support]);
            screen.getByRole('button', { name: 'Act on Sales' }).focus();

            jest.mocked(useGroupMemberships).mockReturnValue([[support], false]);
            rerender(<GroupMembershipSection />);
            const supportButton = screen.getByRole('button', { name: 'Act on Support' });
            expect(supportButton).toHaveFocus();

            // Re-rendering with the same list must not do anything
            rerender(<GroupMembershipSection />);
            expect(supportButton).toHaveFocus();
        });

        it('leaves focus alone when it is outside the table', () => {
            const { rerender } = renderWith([sales, support]);
            const outside = document.createElement('button');
            document.body.appendChild(outside);
            screen.getByRole('button', { name: 'Act on Sales' }).focus();
            outside.focus();

            jest.mocked(useGroupMemberships).mockReturnValue([[support], false]);
            rerender(<GroupMembershipSection />);

            expect(outside).toHaveFocus();
            outside.remove();
        });
    });
});
