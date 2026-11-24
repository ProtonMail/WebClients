import React from 'react';

import { render, screen } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { NodeType } from '@proton/drive/sdk';
import type { MimeIconComponent } from '@proton/file-icons/component';
import { MimeAlbum } from '@proton/file-icons/icons/MimeAlbum';
import { MimeFolder } from '@proton/file-icons/icons/MimeFolder';
import { MimePdf } from '@proton/file-icons/icons/MimePdf';
import { MimeUnknown } from '@proton/file-icons/icons/MimeUnknown';

import { NameCell } from './NameCell';

const defaultProps = {
    uid: 'uid-1',
    name: 'report.pdf',
    type: NodeType.File,
    mediaType: 'application/pdf',
    haveSignatureIssues: false,
};

// File icons inline their markup, so the expected one is rendered at the same size and looked for in the cell.
const getMimeIconMarkup = (Icon: MimeIconComponent) =>
    render(<Icon />, { container: document.createElement('div') }).container.querySelector('svg')?.innerHTML ??
    'missing reference icon';

describe('NameCell', () => {
    it('renders the file name and icon without a thumbnail by default', () => {
        const { container } = renderWithProviders(<NameCell {...defaultProps} />);
        expect(screen.getAllByText('report.pdf').length).toBeGreaterThan(0);
        expect(screen.queryByAltText('report.pdf')).not.toBeInTheDocument();
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimePdf));
    });

    it('renders a thumbnail image when thumbnailUrl is provided', () => {
        renderWithProviders(<NameCell {...defaultProps} thumbnailUrl="blob:thumb" />);
        expect(screen.getByAltText('report.pdf')).toBeInTheDocument();
    });

    it('renders a folder icon for folders', () => {
        const { container } = renderWithProviders(
            <NameCell {...defaultProps} type={NodeType.Folder} name="My Folder" />
        );
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimeFolder));
    });

    it('renders an unknown icon when mediaType is absent', () => {
        const { container } = renderWithProviders(<NameCell {...defaultProps} mediaType={undefined} />);
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimeUnknown));
    });

    it('renders an album icon without a thumbnail for albums', () => {
        const { container } = renderWithProviders(
            <NameCell {...defaultProps} type={NodeType.Album} thumbnailUrl="blob:thumb" />
        );
        expect(container.innerHTML).toContain(getMimeIconMarkup(MimeAlbum));
        expect(screen.queryByAltText('report.pdf')).not.toBeInTheDocument();
    });

    it('applies grayscale filter to thumbnail for invitations', () => {
        renderWithProviders(<NameCell {...defaultProps} thumbnailUrl="blob:thumb" isInvitation />);
        expect(screen.getByAltText('report.pdf')).toHaveStyle({ filter: 'grayscale(100%)' });
    });
});
