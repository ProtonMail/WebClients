import React from 'react';

import { screen } from '@testing-library/react';

import { NodeType } from '@proton/drive';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { NameCell } from './NameCell';

const defaultProps = {
    uid: 'uid-1',
    name: 'report.pdf',
    type: NodeType.File,
    mediaType: 'application/pdf',
    haveSignatureIssues: false,
};

const getMimeIconHref = (container: HTMLElement) => {
    const use = container.querySelector('use');
    return use?.getAttribute('href') || use?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
};

describe('NameCell', () => {
    it('renders the file name and icon without a thumbnail by default', () => {
        const { container } = renderWithProviders(<NameCell {...defaultProps} />);
        expect(screen.getAllByText('report.pdf').length).toBeGreaterThan(0);
        expect(screen.queryByAltText('report.pdf')).not.toBeInTheDocument();
        expect(getMimeIconHref(container)).toContain('pdf');
    });

    it('renders a thumbnail image when thumbnailUrl is provided', () => {
        renderWithProviders(<NameCell {...defaultProps} thumbnailUrl="blob:thumb" />);
        expect(screen.getByAltText('report.pdf')).toBeInTheDocument();
    });

    it('renders a folder icon for folders', () => {
        const { container } = renderWithProviders(
            <NameCell {...defaultProps} type={NodeType.Folder} name="My Folder" />
        );
        expect(getMimeIconHref(container)).toContain('folder');
    });

    it('renders an unknown icon when mediaType is absent', () => {
        const { container } = renderWithProviders(<NameCell {...defaultProps} mediaType={undefined} />);
        expect(getMimeIconHref(container)).toContain('unknown');
    });

    it('renders an album icon without a thumbnail for albums', () => {
        const { container } = renderWithProviders(
            <NameCell {...defaultProps} type={NodeType.Album} thumbnailUrl="blob:thumb" />
        );
        expect(getMimeIconHref(container)).toContain('album');
        expect(screen.queryByAltText('report.pdf')).not.toBeInTheDocument();
    });

    it('applies grayscale filter to thumbnail for invitations', () => {
        renderWithProviders(<NameCell {...defaultProps} thumbnailUrl="blob:thumb" isInvitation />);
        expect(screen.getByAltText('report.pdf')).toHaveStyle({ filter: 'grayscale(100%)' });
    });
});
