import { MemberRole, NonProtonInvitationState } from '@protontech/drive-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemberType } from '../interfaces';
import { DirectSharingListing } from './DirectSharingListing';

jest.mock('@proton/mail/store/contactEmails/hooks', () => ({
    useContactEmails: jest.fn(() => [[]]),
}));

jest.mock('./helpers/getContactNameAndEmail', () => ({
    getContactNameAndEmail: jest.fn((email) => {
        let contactName = '';
        if (email === 'john@example.com') {
            contactName = 'John Doe';
        } else if (email === 'jane@example.com') {
            contactName = 'Jane Smith';
        }
        return {
            contactName,
            contactEmail: email,
        };
    }),
}));

jest.mock('../RoleDropdownMenu', () => ({
    RoleDropdownMenu: ({
        selectedRole,
        disabled,
        isLoading,
        onChangeRole,
        onRemoveAccess,
        onResendInvitationEmail,
        onCopyInvitationLink,
    }: any) => (
        <div data-testid="role-dropdown-menu">
            <button disabled={disabled || isLoading} onClick={() => onChangeRole && onChangeRole(MemberRole.Editor)}>
                {selectedRole}
            </button>
            {onRemoveAccess && <button onClick={onRemoveAccess}>Remove</button>}
            {onResendInvitationEmail && <button onClick={onResendInvitationEmail}>Resend</button>}
            {onCopyInvitationLink && <button onClick={onCopyInvitationLink}>Copy Link</button>}
            <span data-testid="has-resend">{onResendInvitationEmail ? 'true' : 'false'}</span>
            <span data-testid="has-copy">{onCopyInvitationLink ? 'true' : 'false'}</span>
        </div>
    ),
}));

describe('DirectSharingListing', () => {
    const defaultProps = {
        linkId: 'test-link-id',
        ownerEmail: 'owner@example.com',
        ownerDisplayName: 'Owner Name',
        members: [],
        isLoading: false,
        onRemove: jest.fn(),
        onChangeRole: jest.fn(),
        onResendInvitation: jest.fn(),
        onCopyInvitationLink: jest.fn(),
        viewOnly: false,
    };

    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state when isLoading is true', () => {
        render(<DirectSharingListing {...defaultProps} isLoading={true} />);
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('renders owner information with display name', () => {
        render(<DirectSharingListing {...defaultProps} />);

        const ownerSection = screen.getByTestId('share-owner');
        expect(ownerSection).toBeInTheDocument();
        expect(screen.getByText('Owner Name (you)')).toBeInTheDocument();
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('renders empty members list', () => {
        render(<DirectSharingListing {...defaultProps} members={[]} />);

        expect(screen.getByTestId('share-owner')).toBeInTheDocument();
        expect(screen.queryByTestId('share-members')).not.toBeInTheDocument();
    });

    it('renders members list with/without contact names', () => {
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
            {
                inviteeEmail: 'unknown@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-2',
            },
            {
                inviteeEmail: 'jane@example.com',
                role: MemberRole.Editor,
                state: NonProtonInvitationState.UserRegistered,
                type: MemberType.Member,
                uid: 'member-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        const memberElements = screen.getAllByTestId('share-members');
        expect(memberElements).toHaveLength(3);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('unknown@example.com')).toBeInTheDocument();
        expect(screen.getAllByText('unknown@example.com')).toHaveLength(1);
    });

    it('passes correct props to RoleDropdownMenu', () => {
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        expect(screen.getByTestId('role-dropdown-menu')).toBeInTheDocument();
        expect(screen.getByText('viewer')).toBeInTheDocument();
    });

    it('disables RoleDropdownMenu when viewOnly is true', () => {
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} viewOnly={true} />);

        expect(screen.getByText('viewer')).toBeDisabled();
    });

    it('calls onChangeRole when role is changed', async () => {
        const onChangeRole = jest.fn().mockResolvedValue(undefined);
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} onChangeRole={onChangeRole} />);

        const roleButton = screen.getByText('viewer');
        await user.click(roleButton);

        expect(onChangeRole).toHaveBeenCalledWith('john@example.com', MemberRole.Editor);
    });

    it('calls onRemove when remove button is clicked', async () => {
        const onRemove = jest.fn().mockResolvedValue(undefined);
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} onRemove={onRemove} />);

        const removeButton = screen.getByText('Remove');
        await user.click(removeButton);

        await waitFor(() => {
            expect(onRemove).toHaveBeenCalledWith('john@example.com');
        });
    });

    it('calls onResendInvitation for ProtonInvitation', async () => {
        const onResendInvitation = jest.fn().mockResolvedValue(undefined);
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} onResendInvitation={onResendInvitation} />);

        const resendButton = screen.getByText('Resend');
        await user.click(resendButton);

        await waitFor(() => {
            expect(onResendInvitation).toHaveBeenCalledWith('invitation-1');
        });
    });

    it('calls onCopyInvitationLink for ProtonInvitation', async () => {
        const onCopyInvitationLink = jest.fn();
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                state: NonProtonInvitationState.Pending,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(
            <DirectSharingListing {...defaultProps} members={members} onCopyInvitationLink={onCopyInvitationLink} />
        );

        const copyButton = screen.getByText('Copy Link');
        await user.click(copyButton);

        expect(onCopyInvitationLink).toHaveBeenCalledWith('invitation-1', 'john@example.com');
    });

    it('does not show resend and copy buttons for Member type', () => {
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                type: MemberType.Member,
                uid: 'member-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        expect(screen.queryByText('Resend')).not.toBeInTheDocument();
        expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
        expect(screen.getByTestId('has-resend')).toHaveTextContent('false');
        expect(screen.getByTestId('has-copy')).toHaveTextContent('false');
    });

    it('does not show resend and copy buttons for NonProtonInvitation type', () => {
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                type: MemberType.NonProtonInvitation,
                state: NonProtonInvitationState.Pending,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        expect(screen.queryByText('Resend')).not.toBeInTheDocument();
        expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
        expect(screen.getByTestId('has-resend')).toHaveTextContent('false');
        expect(screen.getByTestId('has-copy')).toHaveTextContent('false');
    });

    it('shows resend and copy buttons only for ProtonInvitation type', () => {
        const members = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                type: MemberType.ProtonInvitation,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        expect(screen.getByText('Resend')).toBeInTheDocument();
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
        expect(screen.getByTestId('has-resend')).toHaveTextContent('true');
        expect(screen.getByTestId('has-copy')).toHaveTextContent('true');
    });
});
