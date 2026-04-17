import { MemberRole, NonProtonInvitationState } from '@protontech/drive-sdk';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePopperAnchor } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import type { DirectSharingRole } from '../interfaces';
import { useEditorsManageAccessContext } from '../useEditorsManageAccess';
import { DirectSharingMemberMenu } from './DirectSharingMemberMenu';

jest.mock('@proton/components/components/popper/usePopperAnchor');
jest.mock('@proton/hooks/useLoading');
jest.mock('@proton/utils/noop');
jest.mock('@proton/unleash/useFlag', () => jest.fn(() => false));
jest.mock('../useEditorsManageAccess');

const mockedUsePopperAnchor = jest.mocked(usePopperAnchor);
const mockedUseLoading = jest.mocked(useLoading);
const mockedNoop = jest.mocked(noop);
const mockedUseEditorsManageAccessContext = jest.mocked(useEditorsManageAccessContext);

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
        mockedUseEditorsManageAccessContext.mockReturnValue({
            editorsManageAccess: false,
            changeManageAccess: jest.fn(),
        });
    });

    it('renders with default viewer role', () => {
        render(<DirectSharingMemberMenu {...defaultProps} />);
        expect(screen.getByText('can view')).toBeInTheDocument();
    });

    it('renders with editor role', () => {
        render(<DirectSharingMemberMenu {...defaultProps} selectedRole={MemberRole.Editor} />);
        expect(screen.getByText('can edit')).toBeInTheDocument();
    });

    it('shows pending state for external invitation', () => {
        render(
            <DirectSharingMemberMenu {...defaultProps} externalInvitationState={NonProtonInvitationState.Pending} />
        );
        expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('shows "user joined" for external invitation', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <DirectSharingMemberMenu
                {...defaultProps}
                selectedRole={MemberRole.Editor}
                externalInvitationState={NonProtonInvitationState.UserRegistered}
            />
        );
        expect(screen.getByText('user joined')).toBeInTheDocument();
        expect(screen.getByText('Editor (user joined)')).toBeInTheDocument();
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
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('Viewer (pending)')).toBeInTheDocument();
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
        expect(screen.getAllByText('can view')).toHaveLength(1);
        expect(screen.getAllByText('Viewer')).toHaveLength(1);
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
        expect(screen.getByText('can view')).toBeDisabled();
    });

    it('shows loading state when internal loading is true', () => {
        mockedUseLoading.mockReturnValueOnce([true, jest.fn(), jest.fn()] as any);
        render(<DirectSharingMemberMenu {...defaultProps} />);
        expect(screen.getByText('can view')).toBeDisabled();
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

    it('does not call onChangeRole when transitioning from the same role', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangeRole = jest.fn();
        render(<DirectSharingMemberMenu {...defaultProps} onChangeRole={onChangeRole} />);

        await user.click(screen.getByText('Viewer'));

        expect(onChangeRole).not.toHaveBeenCalled();
        expect(mockedNoop).toHaveBeenCalled();
    });

    it('has checkmark next to "viewer" if current role is viewer', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(<DirectSharingMemberMenu {...defaultProps} selectedRole={MemberRole.Viewer} />);

        const viewerButton = screen.getByText('Viewer').closest('button');
        expect(within(viewerButton!).getByTestId('item-checkmark')).toBeInTheDocument();
        const editorButton = screen.getByText('Editor').closest('button');
        expect(within(editorButton!).queryByTestId('item-checkmark')).not.toBeInTheDocument();
    });

    it('has checkmark next to "editor" if current role is editor', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(<DirectSharingMemberMenu {...defaultProps} selectedRole={MemberRole.Editor} />);

        const viewerButton = screen.getByText('Viewer').closest('button');
        expect(within(viewerButton!).queryByTestId('item-checkmark')).not.toBeInTheDocument();
        const editorButton = screen.getByText('Editor').closest('button');
        expect(within(editorButton!).getByTestId('item-checkmark')).toBeInTheDocument();
    });

    it('when editors can manage access show different label', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        mockedUseEditorsManageAccessContext.mockReturnValueOnce({
            editorsManageAccess: true,
            changeManageAccess: jest.fn(),
        });
        render(<DirectSharingMemberMenu {...defaultProps} />);

        expect(screen.getByText('Can edit and manage access')).toBeInTheDocument();
    });
});
