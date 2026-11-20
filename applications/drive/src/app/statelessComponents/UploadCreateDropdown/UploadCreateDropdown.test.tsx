import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UploadCreateDropdown } from './UploadCreateDropdown';

describe('UploadCreateDropdown', () => {
    const defaultProps = {
        anchorRef: { current: document.createElement('button') },
        isOpen: true,
        onClose: vi.fn(),
    };
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders upload file option when onUploadFile is provided', () => {
        render(<UploadCreateDropdown {...defaultProps} onUploadFile={vi.fn()} />);
        expect(screen.getByText('Upload file')).toBeInTheDocument();
    });

    it('does not render upload file option when onUploadFile is not provided', () => {
        render(<UploadCreateDropdown {...defaultProps} />);
        expect(screen.queryByText('Upload file')).not.toBeInTheDocument();
    });

    it('renders upload folder option when onUploadFolder is provided', () => {
        render(<UploadCreateDropdown {...defaultProps} onUploadFolder={vi.fn()} />);
        expect(screen.getByText('Upload folder')).toBeInTheDocument();
    });

    it('renders create folder option when onCreateFolder is provided', () => {
        render(<UploadCreateDropdown {...defaultProps} onCreateFolder={vi.fn()} />);
        expect(screen.getByText('New folder')).toBeInTheDocument();
    });

    it('renders create document option when onCreateDocument is provided', () => {
        render(<UploadCreateDropdown {...defaultProps} onCreateDocument={vi.fn()} />);
        expect(screen.getByText('New document')).toBeInTheDocument();
    });

    it('renders create spreadsheet option when onCreateSpreadsheet is provided', () => {
        render(<UploadCreateDropdown {...defaultProps} onCreateSpreadsheet={vi.fn()} />);
        expect(screen.getByText('New spreadsheet')).toBeInTheDocument();
    });

    it('calls onUploadFile and onClose when upload file is clicked', async () => {
        const onUploadFile = vi.fn();
        const onClose = vi.fn();
        render(<UploadCreateDropdown {...defaultProps} onUploadFile={onUploadFile} onClose={onClose} />);

        await user.click(screen.getByText('Upload file'));

        expect(onUploadFile).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onCreateFolder and onClose when create folder is clicked', async () => {
        const onCreateFolder = vi.fn();
        const onClose = vi.fn();
        render(<UploadCreateDropdown {...defaultProps} onCreateFolder={onCreateFolder} onClose={onClose} />);

        await user.click(screen.getByText('New folder'));

        expect(onCreateFolder).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders all options when all handlers are provided', () => {
        render(
            <UploadCreateDropdown
                {...defaultProps}
                onUploadFile={vi.fn()}
                onUploadFolder={vi.fn()}
                onCreateFolder={vi.fn()}
                onCreateDocument={vi.fn()}
                onCreateSpreadsheet={vi.fn()}
            />
        );

        expect(screen.getByText('Upload file')).toBeInTheDocument();
        expect(screen.getByText('Upload folder')).toBeInTheDocument();
        expect(screen.getByText('New folder')).toBeInTheDocument();
        expect(screen.getByText('New document')).toBeInTheDocument();
        expect(screen.getByText('New spreadsheet')).toBeInTheDocument();
    });
});
