import { fireEvent, render, screen, within } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import type { EnhancedGroup } from '@proton/shared/lib/interfaces/Group';
import { GroupFlags } from '@proton/shared/lib/interfaces/Group';

import GroupItem from './GroupItem';
import { useGroupsManagement } from './context/GroupsManagementContext';
import { GROUPS_RESTRICTION_REASON, type GroupsRestriction } from './types';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));
jest.mock('./context/GroupsManagementContext', () => ({
    useGroupsManagement: jest.fn(),
}));

const group = { ID: 'group-1', Name: 'Marketing', Flags: GroupFlags.None, Address: { Email: '' } } as EnhancedGroup;
const scimGroup = { ...group, Flags: GroupFlags.Scim } as EnhancedGroup;

const onViewGroup = jest.fn();
const onEditGroup = jest.fn();
const openAddUsersModal = jest.fn();

const renderGroupRow = (
    rowGroup: EnhancedGroup,
    restrictedBy: GroupsRestriction = { reason: GROUPS_RESTRICTION_REASON.NONE }
) => {
    jest.mocked(useGroupsManagement).mockReturnValue({
        restrictedBy,
        selectedGroup: rowGroup,
        groupRolesMap: {},
        actions: { onViewGroup, onEditGroup },
        addUsersToGroupModal: { openModal: openAddUsersModal },
    } as unknown as ReturnType<typeof useGroupsManagement>);

    render(<GroupItem active={false} group={rowGroup} onClick={() => onViewGroup(rowGroup)} />);
    fireEvent.click(screen.getByTitle('More options'));
    onViewGroup.mockClear();
};

const getMenuItemLabels = () => {
    return within(screen.getByRole('list'))
        .getAllByRole('button')
        .map((button) => button.textContent);
};

describe('GroupItemMoreOptionsDropdown', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
            { hasGroupMail: true },
        ] as unknown as ReturnType<typeof useEntitlementChecksForOrgAndUser>);
    });

    it('lists add user, edit group then delete group for a regular group', () => {
        renderGroupRow(group);

        expect(getMenuItemLabels()).toEqual(['Add user', 'Edit group', 'Delete group']);
    });

    it('hides add user for a SCIM group', () => {
        renderGroupRow(scimGroup);

        expect(getMenuItemLabels()).toEqual(['Edit group', 'Delete group']);
    });

    it('hides add user and edit group while the group is resuming role assignment', () => {
        renderGroupRow(group, { reason: GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT, groupId: group.ID });

        expect(getMenuItemLabels()).toEqual(['Delete group']);
    });

    it('edits the group without the click reaching the row', () => {
        renderGroupRow(group);

        fireEvent.click(screen.getByRole('button', { name: 'Edit group' }));

        expect(onEditGroup).toHaveBeenCalledWith(group);
        expect(onViewGroup).not.toHaveBeenCalled();
    });

    it('selects the group then opens the shared add users modal', () => {
        renderGroupRow(group);

        fireEvent.click(screen.getByRole('button', { name: 'Add user' }));

        expect(onViewGroup).toHaveBeenCalledTimes(1);
        expect(onViewGroup).toHaveBeenCalledWith(group);
        expect(openAddUsersModal).toHaveBeenCalledWith(true);
    });
});
