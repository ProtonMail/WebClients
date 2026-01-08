import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePopperAnchor } from '@proton/components';
import { MemberRole, NonProtonInvitationState } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';

import type { DirectSharingRole } from '../interfaces';
import { DirectSharingMemberMenu } from './DirectSharingMemberMenu';

jest.mock('@proton/components/components/popper/usePopperAnchor');
jest.mock('@proton/hooks/useLoading');
jest.mock('@proton/unleash/useFlag', () => jest.fn(() => false));

const mockedUsePopperAnchor = jest.mocked(usePopperAnchor);
const mockedUseLoading = jest.mocked(useLoading);

const defaultUsePopperAnchorProps = {
    anchorRef: { current: null },
    isOpen: false,
    open: jest.fn(),
    toggle: jest.fn(),
    close: jest.fn(),
};

const defaultUseLoadingProps = [false, jest.fn(), jest.fn()] as const;

mockedUsePopperAnchor.mockReturnValue(defaultUsePopperAnchorProps);
mockedUseLoading.mockReturnValue(defaultUseLoadingProps as any);

describe('DirectSharingMemberMenu', () => {
    const defaultProps = {
        disabled: false,
        selectedRole: MemberRole.Viewer as DirectSharingRole,
        onChangeRole: jest.fn(),
        onRemoveAccess: jest.fn().mockResolvedValue(undefined),
    };
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUsePopperAnchor.mockReturnValue(defaultUsePopperAnchorProps);
        mockedUseLoading.mockReturnValue(defaultUseLoadingProps as any);
    });

    it('renders with default viewer role', () => {
        render(<DirectSharingMemberMenu {...defaultProps} />);
        expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('renders with editor role', () => {
        render(<DirectSharingMemberMenu {...defaultProps} selectedRole={MemberRole.Editor} />);
        expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('shows pending state for external invitation', () => {
        render(
            <DirectSharingMemberMenu {...defaultProps} externalInvitationState={NonProtonInvitationState.Pending} />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows accepted state for external invitation', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <DirectSharingMemberMenu
                {...defaultProps}
                selectedRole={MemberRole.Editor}
                externalInvitationState={NonProtonInvitationState.UserRegistered}
            />
        );
        expect(screen.getByText('Accepted')).toBeInTheDocument();
        expect(screen.getByText('Editor (Accepted)')).toBeInTheDocument();
    });

    it('shows menu options for external invitation when pending', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <DirectSharingMemberMenu
                {...defaultProps}
                onResendInvitation={() => Promise.resolve()}
                externalInvitationState={NonProtonInvitationState.Pending}
            />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Viewer (Pending)')).toBeInTheDocument();
        expect(screen.getByText('Editor')).toBeInTheDocument();
        expect(screen.getByText('Resend invite')).toBeInTheDocument();
    });

    it('shows menu options for invitation', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <DirectSharingMemberMenu
                {...defaultProps}
                onRemoveAccess={jest.fn().mockResolvedValue(undefined)}
                onCopyInvitationLink={jest.fn()}
            />
        );
        // Button shows "Viewer" and dropdown also has "Viewer" option
        expect(screen.getAllByText('Viewer')).toHaveLength(2);
        expect(screen.getByText('Editor')).toBeInTheDocument();
        expect(screen.getByText('Remove access')).toBeInTheDocument();
        expect(screen.getByText('Copy invite link')).toBeInTheDocument();
    });

    it('does not show resend invite option when onResendInvitation is not provided', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(<DirectSharingMemberMenu {...defaultProps} />);
        expect(screen.queryByText('Resend invite')).not.toBeInTheDocument();
    });

    it('does not show copy invite link option when onCopyInvitationLink is not provided', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(<DirectSharingMemberMenu {...defaultProps} />);
        expect(screen.queryByText('Copy invite link')).not.toBeInTheDocument();
    });

    it('disables dropdown button when disabled prop is true', () => {
        render(<DirectSharingMemberMenu {...defaultProps} disabled={true} />);
        expect(screen.getByText('Viewer')).toBeDisabled();
    });

    it('shows loading state when internal loading is true', () => {
        mockedUseLoading.mockReturnValueOnce([true, jest.fn(), jest.fn()] as any);
        render(<DirectSharingMemberMenu {...defaultProps} />);
        expect(screen.getByText('Viewer')).toBeDisabled();
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('calls onChangeRole when role option is clicked', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangeRole = jest.fn();
        render(<DirectSharingMemberMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
    });
});
