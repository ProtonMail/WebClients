import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePopperAnchor } from '@proton/components';
import { MemberRole, NonProtonInvitationState } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';

import { RoleDropdownMenu } from './RoleDropdownMenu';

jest.mock('@proton/components/components/popper/usePopperAnchor');
jest.mock('@proton/hooks/useLoading');

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

describe('RoleDropdownMenu', () => {
    const defaultProps = {
        selectedRole: MemberRole.Viewer,
        onChangeRole: jest.fn(),
    };
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUsePopperAnchor.mockReturnValue(defaultUsePopperAnchorProps);
        mockedUseLoading.mockReturnValue(defaultUseLoadingProps as any);
    });

    it('renders with default viewer role', () => {
        render(<RoleDropdownMenu {...defaultProps} />);
        expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('renders with editor role', () => {
        render(<RoleDropdownMenu {...defaultProps} selectedRole={MemberRole.Editor} />);
        expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('shows pending state for external invitation', () => {
        render(<RoleDropdownMenu {...defaultProps} externalInvitationState={NonProtonInvitationState.Pending} />);
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows accepted state for external invitation', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <RoleDropdownMenu
                {...defaultProps}
                selectedRole={MemberRole.Editor}
                externalInvitationState={NonProtonInvitationState.UserRegistered}
            />
        );
        expect(screen.getByText('Accepted')).toBeInTheDocument();
        expect(screen.getByText('Editor (Accepted)')).toBeInTheDocument();
        expect(screen.getByText('Make viewer')).toBeInTheDocument();
    });

    it('shows menu options for external invitation when pending', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <RoleDropdownMenu
                {...defaultProps}
                onResendInvitationEmail={jest.fn()}
                externalInvitationState={NonProtonInvitationState.Pending}
            />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Viewer (Pending)')).toBeInTheDocument();
        expect(screen.getByText('Make editor')).toBeInTheDocument();
        expect(screen.getByText('Resend invite')).toBeInTheDocument();
    });

    it('shows menu options for invitation', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(<RoleDropdownMenu {...defaultProps} onRemoveAccess={jest.fn()} onCopyInvitationLink={jest.fn()} />);
        expect(screen.getAllByText('Viewer').length).toEqual(2);
        expect(screen.getByText('Make editor')).toBeInTheDocument();
        expect(screen.getByText('Remove access')).toBeInTheDocument();
        expect(screen.getByText('Copy invite link')).toBeInTheDocument();
    });

    it('disables dropdown button when disabled prop is true', () => {
        render(<RoleDropdownMenu {...defaultProps} disabled={true} />);
        expect(screen.getByText('Viewer')).toBeDisabled();
    });

    it('shows loading state when internal loading is true', () => {
        mockedUseLoading.mockReturnValueOnce([true, jest.fn(), jest.fn()] as any);
        render(<RoleDropdownMenu {...defaultProps} />);
        expect(screen.getByText('Viewer')).toBeDisabled();
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('calls onChangeRole when permission option is clicked', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangeRole = jest.fn();
        render(<RoleDropdownMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Make editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
    });

    it('does not show loading state with sync onChangeRole', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangeRole = jest.fn();
        render(<RoleDropdownMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Make editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
        expect(screen.queryByTestId('circle-loader')).not.toBeInTheDocument();
    });

    it('shows loading state with async onChangeRole', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const withLoading = jest.fn((promise) => promise);
        mockedUseLoading.mockReturnValueOnce([false, withLoading, jest.fn()] as any);

        const onChangeRole = jest.fn().mockResolvedValue(undefined);
        render(<RoleDropdownMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Make editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
        expect(withLoading).toHaveBeenCalled();
    });
});
