import React from 'react';

import { screen } from '@testing-library/react';

import { NodeType } from '@proton/drive';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { GridItemContent } from './GridItemContent';

const defaultProps = {
    name: 'report.pdf',
    type: NodeType.File,
    mediaType: 'application/pdf',
};

const getMimeIconHref = (container: HTMLElement) => {
    const use = container.querySelector('use');
    return use?.getAttribute('href') || use?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
};

describe('GridItemContent', () => {
    it('renders file icon without button by default', () => {
        const { container } = renderWithProviders(<GridItemContent {...defaultProps} />);
        expect(getMimeIconHref(container)).toContain('pdf');
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
        expect(getMimeIconHref(container)).toContain('folder');
    });

    it('renders an unknown icon when mediaType is absent', () => {
        const { container } = renderWithProviders(<GridItemContent {...defaultProps} mediaType={undefined} />);
        expect(getMimeIconHref(container)).toContain('unknown');
    });

    it('renders an album icon without a thumbnail for albums', () => {
        const { container } = renderWithProviders(
            <GridItemContent {...defaultProps} type={NodeType.Album} thumbnailUrl="blob:thumb" />
        );
        expect(getMimeIconHref(container)).toContain('album');
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
