import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePopperAnchor } from '@proton/components';
import { SHARE_EXTERNAL_INVITATION_STATE } from '@proton/shared/lib/drive/constants';
import { SHARE_MEMBER_PERMISSIONS, SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

import { PublicPermissionsDropdownMenu } from './PublicPermissionsDropdownMenu';

jest.mock('@proton/components/components/popper/usePopperAnchor');
const mockedUsePopperAnchor = jest.mocked(usePopperAnchor);

const defaultUsePopperAnchorProps = {
    anchorRef: { current: null },
    isOpen: false,
    open: jest.fn(),
    toggle: jest.fn(),
    close: jest.fn(),
};
mockedUsePopperAnchor.mockReturnValue(defaultUsePopperAnchorProps);

describe('PublicPermissionsDropdownMenu', () => {
    const defaultProps = {
        selectedPermissions: SHARE_MEMBER_PERMISSIONS.VIEWER,
        onChangePermissions: jest.fn(),
    };
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with default viewer permissions', () => {
        render(<PublicPermissionsDropdownMenu {...defaultProps} />);
        expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('renders with editor permissions', () => {
        render(
            <PublicPermissionsDropdownMenu {...defaultProps} selectedPermissions={SHARE_MEMBER_PERMISSIONS.EDITOR} />
        );
        expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('shows pending state for external invitation', () => {
        render(
            <PublicPermissionsDropdownMenu
                {...defaultProps}
                externalInvitationState={SHARE_EXTERNAL_INVITATION_STATE.PENDING}
            />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows accepted state for external invitation', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <PublicPermissionsDropdownMenu
                {...defaultProps}
                selectedPermissions={SHARE_MEMBER_PERMISSIONS.EDITOR}
                externalInvitationState={SHARE_EXTERNAL_INVITATION_STATE.USER_REGISTERED}
            />
        );
        expect(screen.getByText('Accepted')).toBeInTheDocument();
        expect(screen.getByText('Editor (Accepted)')).toBeInTheDocument();
        expect(screen.getByText('Make viewer')).toBeInTheDocument();
    });

    it('shows menu options for external invitation when pending', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <PublicPermissionsDropdownMenu
                {...defaultProps}
                onResendInvitationEmail={jest.fn()}
                externalInvitationState={SHARE_EXTERNAL_INVITATION_STATE.PENDING}
            />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Viewer (Pending)')).toBeInTheDocument();
        expect(screen.getByText('Make editor')).toBeInTheDocument();
        expect(screen.getByText('Resend invite')).toBeInTheDocument();
    });

    it('shows menu options for invitation', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <PublicPermissionsDropdownMenu
                {...defaultProps}
                onRemoveAccess={jest.fn()}
                onCopyShareInviteLink={jest.fn()}
            />
        );
        expect(screen.getAllByText('Viewer').length).toEqual(2);
        expect(screen.getByText('Make editor')).toBeInTheDocument();
        expect(screen.getByText('Remove access')).toBeInTheDocument();
        expect(screen.getByText('Copy invite link')).toBeInTheDocument();
    });

    it('disables dropdown button when disabled prop is true', () => {
        render(<PublicPermissionsDropdownMenu {...defaultProps} disabled={true} />);
        expect(screen.getByText('Viewer')).toBeDisabled();
    });

    it('shows loading state when isLoading is true', () => {
        render(<PublicPermissionsDropdownMenu {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Viewer')).toBeDisabled();
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('renders public sharing current permission when publicSharingOptions is true', () => {
        render(
            <PublicPermissionsDropdownMenu
                {...defaultProps}
                publicSharingOptions={true}
                selectedPermissions={SHARE_URL_PERMISSIONS.VIEWER}
            />
        );
        expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('renders public sharing options when publicSharingOptions is true and menu opened', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(
            <PublicPermissionsDropdownMenu
                {...defaultProps}
                publicSharingOptions={true}
                selectedPermissions={SHARE_URL_PERMISSIONS.VIEWER}
            />
        );
        expect(screen.getAllByText('Viewer').length).toEqual(2);
        expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('calls onChangePermissions when permission option is clicked', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangePermissions = jest.fn();
        render(<PublicPermissionsDropdownMenu {...defaultProps} onChangePermissions={onChangePermissions} />);

        const editorOption = screen.getByText('Make editor');
        await user.click(editorOption);

        expect(onChangePermissions).toHaveBeenCalledWith(SHARE_MEMBER_PERMISSIONS.EDITOR);
    });
});
