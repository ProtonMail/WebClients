import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePopperAnchor } from '@proton/components/index';
import { MemberRole } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';

import { PublicRoleDropdownMenu } from './PublicRoleDropdownMenu';

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

describe('PublicRoleDropdownMenu', () => {
    const defaultProps = {
        selectedRole: MemberRole.Viewer,
        onChangeRole: jest.fn(),
        disabled: false,
    };
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUsePopperAnchor.mockReturnValue(defaultUsePopperAnchorProps);
        mockedUseLoading.mockReturnValue(defaultUseLoadingProps as any);
    });

    it('renders with default viewer role', () => {
        render(<PublicRoleDropdownMenu {...defaultProps} />);
        expect(screen.getByText('can view')).toBeInTheDocument();
    });

    it('renders with editor role', () => {
        render(<PublicRoleDropdownMenu {...defaultProps} selectedRole={MemberRole.Editor} />);
        expect(screen.getByText('can edit')).toBeInTheDocument();
    });

    it('shows role options when dropdown is open', () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        render(<PublicRoleDropdownMenu {...defaultProps} />);
        expect(screen.getByText('Viewer')).toBeInTheDocument();
        expect(screen.getByText('Can view only')).toBeInTheDocument();
        expect(screen.getByText('Editor')).toBeInTheDocument();
        expect(screen.getByText('Can view and edit')).toBeInTheDocument();
    });

    it('disables dropdown button when disabled prop is true', () => {
        render(<PublicRoleDropdownMenu {...defaultProps} disabled={true} />);
        expect(screen.getByText('can view')).toBeDisabled();
    });

    it('shows loading state when internal loading is true', () => {
        mockedUseLoading.mockReturnValueOnce([true, jest.fn(), jest.fn()] as any);
        render(<PublicRoleDropdownMenu {...defaultProps} />);
        expect(screen.getByText('can view')).toBeDisabled();
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('calls onChangeRole when permission option is clicked', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangeRole = jest.fn();
        render(<PublicRoleDropdownMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
    });

    it('does not show loading state with sync onChangeRole', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const onChangeRole = jest.fn();
        render(<PublicRoleDropdownMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
        expect(screen.queryByTestId('circle-loader')).not.toBeInTheDocument();
    });

    it('shows loading state with async onChangeRole', async () => {
        mockedUsePopperAnchor.mockReturnValueOnce({ ...defaultUsePopperAnchorProps, isOpen: true });
        const withLoading = jest.fn((promise) => promise);
        mockedUseLoading.mockReturnValueOnce([false, withLoading, jest.fn()] as any);

        const onChangeRole = jest.fn().mockResolvedValue(undefined);
        render(<PublicRoleDropdownMenu {...defaultProps} onChangeRole={onChangeRole} />);

        const editorOption = screen.getByText('Editor');
        await user.click(editorOption);

        expect(onChangeRole).toHaveBeenCalledWith(MemberRole.Editor);
        expect(withLoading).toHaveBeenCalled();
    });
});
