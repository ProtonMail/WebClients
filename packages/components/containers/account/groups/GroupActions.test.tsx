import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
    GROUP_MEMBERSHIP_STATUS,
    GROUP_MEMBER_PERMISSIONS,
    type GroupMembership,
} from '@proton/shared/lib/interfaces/GroupMember';

import GroupActions from './GroupActions';
import useGroupActions from './useGroupActions';

// Mocked so that the confirmation prompt renders in the same container
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: (node: any) => node,
}));

jest.mock('./useGroupActions', () => jest.fn());

const acceptInvitation = jest.fn(() => Promise.resolve());
const declineInvitation = jest.fn(() => Promise.resolve());
const leaveMembership = jest.fn(() => Promise.resolve());

const getMembership = (overrides: Partial<GroupMembership> = {}): GroupMembership => ({
    Name: 'Sales',
    Address: 'sales@example.com',
    Status: GROUP_MEMBERSHIP_STATUS.ACTIVE,
    Keys: { PrivateKey: '', ActivationToken: '' },
    AddressID: 'address-id',
    ID: 'membership-id',
    Permissions: GROUP_MEMBER_PERMISSIONS.LEAVE,
    ...overrides,
});

describe('GroupActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useGroupActions).mockReturnValue({ acceptInvitation, declineInvitation, leaveMembership });
    });

    it('offers accept and decline for an invitation', () => {
        render(<GroupActions membership={getMembership({ Status: GROUP_MEMBERSHIP_STATUS.UNANSWERED })} />);

        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        expect(acceptInvitation).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Leave' })).not.toBeInTheDocument();
    });

    it('only offers accept for an invitation the member is not allowed to leave', () => {
        render(
            <GroupActions
                membership={getMembership({
                    Status: GROUP_MEMBERSHIP_STATUS.UNANSWERED,
                    Permissions: GROUP_MEMBER_PERMISSIONS.NONE,
                })}
            />
        );

        expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
    });

    it('asks for confirmation before leaving a group', async () => {
        render(<GroupActions membership={getMembership()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
        expect(leaveMembership).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('confirmLeaveGroup'));

        await waitFor(() => expect(leaveMembership).toHaveBeenCalledTimes(1));
    });

    it('keeps the disabled leave button focusable and explains why', () => {
        render(<GroupActions membership={getMembership({ Permissions: GROUP_MEMBER_PERMISSIONS.NONE })} />);

        const button = screen.getByRole('button', { name: /Leave/ });

        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();
        expect(button).toHaveAccessibleName('Leave. You do not have permission to perform this action');
    });
});
