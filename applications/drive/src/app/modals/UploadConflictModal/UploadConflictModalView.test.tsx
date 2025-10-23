import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NodeType } from '@proton/drive';

import { UploadConflictStrategy, UploadConflictType } from '../../zustand/upload/types';
import { UploadConflictModalView } from './UploadConflictModalView';

describe('UploadConflictModalView', () => {
    const mockOnResolve = jest.fn();
    const mockOnCancelAll = jest.fn();
    const mockOnClose = jest.fn();
    const mockOnExit = jest.fn();

    const defaultProps = {
        name: 'test-file.txt',
        nodeType: NodeType.File,
        conflictType: UploadConflictType.Normal,
        onResolve: mockOnResolve,
        onCancelAll: mockOnCancelAll,
        onClose: mockOnClose,
        onExit: mockOnExit,
        open: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render complete file conflict UI with normal conflict message', () => {
        render(<UploadConflictModalView {...defaultProps} />);

        expect(screen.getByText('Duplicate found')).toBeInTheDocument();
        expect(screen.getByText('test-file.txt')).toBeInTheDocument();
        expect(screen.getByText(/already exists in this location/)).toBeInTheDocument();
        expect(screen.getByTestId('replace-existing')).toBeInTheDocument();
        expect(screen.getByTestId('keep-both')).toBeInTheDocument();
        expect(screen.getByTestId('skip-upload')).toBeInTheDocument();
        expect(screen.getByText('Apply to all duplicated files')).toBeInTheDocument();
        expect(screen.getByText('Cancel all uploads')).toBeInTheDocument();
        expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should render draft conflict message with replace file explanation', () => {
        render(<UploadConflictModalView {...defaultProps} conflictType={UploadConflictType.Draft} />);

        expect(screen.getByText(/recently tried to upload/)).toBeInTheDocument();
        expect(screen.getByText('Replace file')).toBeInTheDocument();
        expect(
            screen.getByText(/If the upload is still in progress, replacing it will cancel the ongoing upload/)
        ).toBeInTheDocument();
    });

    it('should render folder-specific UI with disabled rename option', () => {
        render(<UploadConflictModalView {...defaultProps} nodeType={NodeType.Folder} name="test-folder" />);

        expect(screen.getByText('test-folder')).toBeInTheDocument();
        expect(screen.getByText('Skip folder')).toBeInTheDocument();
        expect(screen.getByText('Folder will not be uploaded')).toBeInTheDocument();
        expect(screen.getByText(/This will replace the existing folder or file with the folder/)).toBeInTheDocument();
        expect(screen.getByText('Apply to all duplicated folders')).toBeInTheDocument();

        const renameRadio = screen.getByTestId(`strategy-${UploadConflictStrategy.Rename}`);
        expect(renameRadio).toBeDisabled();
    });

    it('should enable rename option for files', () => {
        render(<UploadConflictModalView {...defaultProps} />);

        const renameRadio = screen.getByTestId(`strategy-${UploadConflictStrategy.Rename}`);
        expect(renameRadio).not.toBeDisabled();
    });

    it('should default to Replace strategy and allow changing strategies', async () => {
        const user = userEvent.setup();
        render(<UploadConflictModalView {...defaultProps} />);

        const skipRadio = screen.getByTestId(`strategy-${UploadConflictStrategy.Skip}`);
        const renameRadio = screen.getByTestId(`strategy-${UploadConflictStrategy.Rename}`);
        const replaceRadio = screen.getByTestId(`strategy-${UploadConflictStrategy.Replace}`);

        expect(replaceRadio).toBeChecked();
        expect(renameRadio).not.toBeChecked();
        expect(skipRadio).not.toBeChecked();

        await user.click(renameRadio);
        expect(renameRadio).toBeChecked();

        await user.click(skipRadio);
        expect(skipRadio).toBeChecked();
    });

    it('should toggle apply to all checkbox', async () => {
        const user = userEvent.setup();
        render(<UploadConflictModalView {...defaultProps} />);

        const checkbox = screen.getByTestId('apply-to-all');
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);
        expect(checkbox).toBeChecked();

        await user.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it('should submit with selected strategy and applyAll state', async () => {
        render(<UploadConflictModalView {...defaultProps} />);

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Replace, false);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit with Rename strategy when selected', async () => {
        const user = userEvent.setup();
        render(<UploadConflictModalView {...defaultProps} />);

        const renameRadio = screen.getByTestId(`strategy-${UploadConflictStrategy.Rename}`);
        await user.click(renameRadio);

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Rename, false);
    });

    it('should submit with applyAll true when checkbox is checked', async () => {
        const user = userEvent.setup();
        render(<UploadConflictModalView {...defaultProps} />);

        const checkbox = screen.getByTestId('apply-to-all');
        await user.click(checkbox);

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Replace, true);
    });

    it('should call onCancelAll when cancel button clicked', () => {
        render(<UploadConflictModalView {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel all uploads');
        fireEvent.click(cancelButton);

        expect(mockOnCancelAll).toHaveBeenCalled();
    });
});
