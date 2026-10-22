import React from 'react';

import { render, screen } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { NodeType } from '@proton/drive/sdk';
import type { MimeIconComponent } from '@proton/file-icons/component';
import { MimeAlbum } from '@proton/file-icons/icons/MimeAlbum';
import { MimeFolder } from '@proton/file-icons/icons/MimeFolder';
import { MimePdf } from '@proton/file-icons/icons/MimePdf';
import { MimeUnknown } from '@proton/file-icons/icons/MimeUnknown';

import { GridItemContent } from './GridItemContent';

const defaultProps = {
    name: 'report.pdf',
    type: NodeType.File,
    mediaType: 'application/pdf',
};

// File icons inline their markup, so the expected one is rendered at the same size and looked for in the cell.
const getMimeIconMarkup = (Icon: MimeIconComponent) =>
    render(<Icon size={12} />, { container: document.createElement('div') }).container.querySelector('svg')
        ?.innerHTML ?? 'missing reference icon';

describe('GridItemContent', () => {
    it('renders file icon without button by default', () => {
        const { container } = renderWithProviders(<GridItemContent {...defaultProps} />);
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimePdf));
        expect(container.querySelector('img')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a thumbnail image when thumbnailUrl is provided', () => {
        renderWithProviders(<GridItemContent {...defaultProps} thumbnailUrl="blob:thumb" />);
        expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:thumb');
    });

    it('renders a folder icon for folders', () => {
        const { container } = renderWithProviders(
            <GridItemContent {...defaultProps} type={NodeType.Folder} name="My Folder" />
        );
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimeFolder));
    });

    it('renders an unknown icon when mediaType is absent', () => {
        const { container } = renderWithProviders(<GridItemContent {...defaultProps} mediaType={undefined} />);
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimeUnknown));
    });

    it('renders an album icon without a thumbnail for albums', () => {
        const { container } = renderWithProviders(
            <GridItemContent {...defaultProps} type={NodeType.Album} thumbnailUrl="blob:thumb" />
        );
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimeAlbum));
        expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('applies grayscale filter to the icon for invitations', () => {
        const { container } = renderWithProviders(<GridItemContent {...defaultProps} isInvitation />);
        expect(container.querySelector('svg')).toHaveStyle({ filter: 'grayscale(100%)' });
    });

    it('wraps content in a button when onClick is provided', () => {
        renderWithProviders(<GridItemContent {...defaultProps} onClick={jest.fn()} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders the badge when provided', () => {
        renderWithProviders(<GridItemContent {...defaultProps} badge={<span>New</span>} />);
        expect(screen.getByText('New')).toBeInTheDocument();
    });
});
