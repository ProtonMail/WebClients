import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemberRole, NonProtonInvitationState } from '@proton/drive';

import type { DirectMember } from '../interfaces';
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

const MEMBERS: DirectMember[] = [
    {
        inviteeEmail: 'john@example.com',
        role: MemberRole.Viewer,
        type: MemberType.ProtonInvitation,
        uid: 'invitation-1',
    },
];

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

    it('renders owner information without display name', () => {
        render(<DirectSharingListing {...defaultProps} ownerDisplayName={undefined} />);

        const ownerSection = screen.getByTestId('share-owner');
        expect(ownerSection).toBeInTheDocument();
        expect(screen.getByText('owner@example.com (you)')).toBeInTheDocument();
        expect(screen.queryByTitle('owner@example.com')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('renders empty members list', () => {
        render(<DirectSharingListing {...defaultProps} members={[]} />);

        expect(screen.getByTestId('share-owner')).toBeInTheDocument();
        expect(screen.queryByTestId('share-members')).not.toBeInTheDocument();
    });

    it('renders members list with/without contact names', () => {
        const members: DirectMember[] = [
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

    it('renders member dropdown with correct role', () => {
        render(<DirectSharingListing {...defaultProps} members={MEMBERS} />);

        expect(screen.getByTestId('dropdown-button')).toBeInTheDocument();
        expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('disables dropdown when viewOnly is true', () => {
        render(<DirectSharingListing {...defaultProps} members={MEMBERS} viewOnly={true} />);

        expect(screen.getByText('Viewer')).toBeDisabled();
    });

    it('calls onChangeRole when role is changed', async () => {
        const onChangeRole = jest.fn().mockResolvedValue(undefined);

        render(<DirectSharingListing {...defaultProps} members={MEMBERS} onChangeRole={onChangeRole} />);

        // Open the dropdown
        await user.click(screen.getByTestId('dropdown-button'));

        // Click on Editor role option
        await user.click(screen.getByText('Editor'));

        expect(onChangeRole).toHaveBeenCalledWith('john@example.com', MemberRole.Editor);
    });

    it('calls onRemove when remove access is clicked', async () => {
        const onRemove = jest.fn().mockResolvedValue(undefined);

        render(<DirectSharingListing {...defaultProps} members={MEMBERS} onRemove={onRemove} />);

        await user.click(screen.getByTestId('dropdown-button'));
        await user.click(screen.getByText('Remove access'));

        await waitFor(() => {
            expect(onRemove).toHaveBeenCalledWith('john@example.com');
        });
    });

    it('calls onResendInvitation for ProtonInvitation', async () => {
        const onResendInvitation = jest.fn().mockResolvedValue(undefined);

        render(<DirectSharingListing {...defaultProps} members={MEMBERS} onResendInvitation={onResendInvitation} />);

        await user.click(screen.getByTestId('dropdown-button'));
        await user.click(screen.getByText('Resend invite'));

        await waitFor(() => {
            expect(onResendInvitation).toHaveBeenCalledWith('invitation-1');
        });
    });

    it('calls onCopyInvitationLink for ProtonInvitation', async () => {
        const onCopyInvitationLink = jest.fn();

        render(
            <DirectSharingListing {...defaultProps} members={MEMBERS} onCopyInvitationLink={onCopyInvitationLink} />
        );

        await user.click(screen.getByTestId('dropdown-button'));
        await user.click(screen.getByText('Copy invite link'));

        expect(onCopyInvitationLink).toHaveBeenCalledWith('invitation-1', 'john@example.com');
    });

    it('does not show resend and copy options for Member type', async () => {
        const members: DirectMember[] = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                type: MemberType.Member,
                uid: 'member-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        // Open the dropdown
        await user.click(screen.getByTestId('dropdown-button'));

        expect(screen.queryByText('Resend invite')).not.toBeInTheDocument();
        expect(screen.queryByText('Copy invite link')).not.toBeInTheDocument();
        // Remove access should still be available
        expect(screen.getByText('Remove access')).toBeInTheDocument();
    });

    it('does not show resend and copy options for NonProtonInvitation type', async () => {
        const members: DirectMember[] = [
            {
                inviteeEmail: 'john@example.com',
                role: MemberRole.Viewer,
                type: MemberType.NonProtonInvitation,
                state: NonProtonInvitationState.Pending,
                uid: 'invitation-1',
            },
        ];

        render(<DirectSharingListing {...defaultProps} members={members} />);

        // Open the dropdown
        await user.click(screen.getByTestId('dropdown-button'));

        expect(screen.queryByText('Resend invite')).not.toBeInTheDocument();
        expect(screen.queryByText('Copy invite link')).not.toBeInTheDocument();
        // Remove access should still be available
        expect(screen.getByText('Remove access')).toBeInTheDocument();
    });

    it('shows resend and copy options for ProtonInvitation type', async () => {
        render(<DirectSharingListing {...defaultProps} members={MEMBERS} />);

        // Open the dropdown
        await user.click(screen.getByTestId('dropdown-button'));

        expect(screen.getByText('Resend invite')).toBeInTheDocument();
        expect(screen.getByText('Copy invite link')).toBeInTheDocument();
        expect(screen.getByText('Remove access')).toBeInTheDocument();
    });
});
