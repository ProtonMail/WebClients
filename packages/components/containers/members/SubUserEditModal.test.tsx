import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { assignMemberRoles } from '@proton/account';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';
import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME, ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';

import SubUserEditModal from './SubUserEditModal';

jest.mock('@proton/atoms/Portal/Portal');

jest.mock('@proton/account', () => ({
    ...jest.requireActual('@proton/account'),
    editMember: jest.fn(() => ({ type: 'editMember' })),
    assignMemberRoles: jest.fn(() => ({ type: 'assignMemberRoles' })),
    getMemberAddresses: jest.fn(() => ({ type: 'getMemberAddresses' })),
}));

const mockDispatch = jest.fn(async ({ type }: { type: string }) => {
    if (type === 'editMember') {
        return { member: undefined, diff: false };
    }
    if (type === 'assignMemberRoles') {
        return { roleAssignments: [], changed: true };
    }
});
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    ...jest.requireActual('@proton/redux-shared-store/sharedProvider'),
    useDispatch: () => mockDispatch,
}));

jest.mock('@proton/account/userPermissions/hooks', () => {
    const actual = jest.requireActual('@proton/account/userPermissions/hooks');
    return {
        ...actual,
        useAdminRolesUI: () => [actual.AdminRolesUIState.Enabled, false],
        useUserPermissions: () => [{ Roles: [] }],
    };
});

const mockOwnerRole: OrganizationRole = {
    OrganizationRoleID: 'owner-role',
    OrganizationID: 'organization',
    Name: PREDEFINED_ROLE_NAME.OWNER,
    Description: null,
    Flags: 0,
    CreateTime: 0,
    UpdateTime: 0,
};
const mockUserAdminRole: OrganizationRole = {
    ...mockOwnerRole,
    OrganizationRoleID: 'user-admin-role',
    Name: PREDEFINED_ROLE_NAME.USER_ADMIN,
};
jest.mock('@proton/account/organizationRoles/hooks', () => ({
    useOrganizationRoles: () => [[mockOwnerRole, mockUserAdminRole], false],
}));

jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: () => [{ MaxVPN: 0, MaxAI: 0, MaxLumo: 0 }],
}));
jest.mock('@proton/account/organizationKey/hooks', () => ({
    useOrganizationKey: () => [undefined],
}));
jest.mock('@proton/features', () => ({
    ...jest.requireActual('@proton/features'),
    useFeature: () => ({ feature: undefined, loading: false }),
}));
jest.mock('@proton/activation/src/hooks/useBYOEFeatureStatus', () => ({
    __esModule: true,
    default: () => [false],
}));
const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
jest.mock('../../hooks/useSilentApi', () => ({
    useSilentApi: () => jest.fn(),
}));
jest.mock('../../hooks/useSpotlightOnFeature', () => ({
    __esModule: true,
    default: () => ({ show: false, onDisplayed: jest.fn(), onClose: jest.fn() }),
}));
jest.mock('./rolesAndPermissions/AdminRolesSpotlight', () => ({
    __esModule: true,
    default: ({ children }: { children: JSX.Element }) => children,
}));

const getRoleAssignment = (Role: OrganizationRole): RoleAssignment => ({
    OrganizationID: 'organization',
    AssignmentTime: 0,
    Role,
    Source: ROLE_SOURCE.USER,
    SourceID: 'member',
    SourceGroupName: null,
});

const getMember = (member: Partial<EnhancedMember>) =>
    ({
        ID: 'member',
        Name: 'admin',
        Role: MEMBER_ROLE.ORGANIZATION_ADMIN,
        Private: MEMBER_PRIVATE.READABLE,
        MaxSpace: 0,
        MaxVPN: 0,
        NumAI: 0,
        NumLumo: 0,
        Self: 0,
        SSO: 0,
        Unprivatization: null,
        addressState: 'partial',
        roleState: 'full',
        UserOrganizationRoles: [],
        requiresOrgKeyPromotion: false,
        ...member,
    }) as EnhancedMember;

const onClose = jest.fn();

const renderModal = (member: EnhancedMember) => {
    const getModal = (member: EnhancedMember) => (
        <SubUserEditModal
            open
            onClose={onClose}
            member={member}
            aiSeatsRemaining={false}
            lumoSeatsRemaining={false}
            allowLumoConfiguration={false}
        />
    );
    const { rerender } = render(getModal(member));
    return { rerender: (member: EnhancedMember) => rerender(getModal(member)) };
};

const save = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
};

describe('SubUserEditModal', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        { Self: 1, description: 'self' },
        { Self: 0, description: 'another member' },
    ])('does not submit roles that loaded after opening for $description', async ({ Self }) => {
        const { rerender } = renderModal(getMember({ Self, roleState: 'pending' }));
        rerender(getMember({ Self, roleState: 'full', UserOrganizationRoles: [getRoleAssignment(mockOwnerRole)] }));

        await save();

        expect(assignMemberRoles).not.toHaveBeenCalled();
    });

    it('submits an added role together with the existing ones', async () => {
        renderModal(getMember({ UserOrganizationRoles: [getRoleAssignment(mockOwnerRole)] }));

        fireEvent.click(screen.getByRole('tab', { name: 'Roles and permissions' }));
        fireEvent.click(screen.getByLabelText('User Admin'));
        await save();

        expect(assignMemberRoles).toHaveBeenCalledWith(
            expect.objectContaining({ desiredRoleIds: new Set(['owner-role', 'user-admin-role']) })
        );
    });

    it('disables role selection until the member roles have loaded', () => {
        const { rerender } = renderModal(getMember({ roleState: 'pending' }));

        fireEvent.click(screen.getByRole('tab', { name: 'Roles and permissions' }));
        expect(screen.getByLabelText('User Admin')).toBeDisabled();

        rerender(getMember({ roleState: 'full' }));
        expect(screen.getByLabelText('User Admin')).toBeEnabled();
    });

    it('disables role selection when the member roles failed to load', () => {
        renderModal(getMember({ roleState: 'rejected' }));

        fireEvent.click(screen.getByRole('tab', { name: 'Roles and permissions' }));

        expect(screen.getByLabelText('User Admin')).toBeDisabled();
    });

    it('disables save while edited member roles reload, then submits the removal', async () => {
        const roles = [getRoleAssignment(mockOwnerRole), getRoleAssignment(mockUserAdminRole)];
        const { rerender } = renderModal(getMember({ UserOrganizationRoles: roles }));

        fireEvent.click(screen.getByRole('tab', { name: 'Roles and permissions' }));
        fireEvent.click(screen.getByLabelText('User Admin'));
        rerender(getMember({ roleState: 'initial' }));
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

        rerender(getMember({ UserOrganizationRoles: roles }));
        await save();

        expect(assignMemberRoles).toHaveBeenCalledWith(
            expect.objectContaining({ currentRoles: roles, desiredRoleIds: new Set(['owner-role']) })
        );
    });

    it('saves without the edited roles when the member roles fail to reload', async () => {
        const roles = [getRoleAssignment(mockOwnerRole), getRoleAssignment(mockUserAdminRole)];
        const { rerender } = renderModal(getMember({ UserOrganizationRoles: roles }));

        fireEvent.click(screen.getByRole('tab', { name: 'Roles and permissions' }));
        fireEvent.click(screen.getByLabelText('User Admin'));
        rerender(getMember({ roleState: 'rejected' }));
        expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

        await save();

        expect(assignMemberRoles).not.toHaveBeenCalled();
        expect(mockCreateNotification).toHaveBeenCalledWith({
            type: 'error',
            text: "Role changes were not saved because the user's roles could not be loaded.",
        });
    });
});
