import React from 'react';

import { screen } from '@testing-library/react';

import { NodeType } from '@proton/drive';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { FileCard } from './FileCard';

describe('FileCard', () => {
    it('displays the file name', () => {
        renderWithProviders(
            <FileCard name="document.pdf" size={1024} mediaType="application/pdf" type={NodeType.File} />
        );
        expect(screen.getAllByText('document.pdf').length).toBeGreaterThan(0);
    });

    it('displays a human-readable file size for files', () => {
        renderWithProviders(<FileCard name="photo.jpg" size={2048} mediaType="image/jpeg" type={NodeType.File} />);
        expect(screen.getByText(humanSize({ bytes: 2048 }))).toBeInTheDocument();
    });

    it('shows placeholder when size is undefined', () => {
        renderWithProviders(<FileCard name="file.txt" size={undefined} mediaType="text/plain" type={NodeType.File} />);
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('does not show file size for folders', () => {
        renderWithProviders(<FileCard name="My Folder" size={999} mediaType={undefined} type={NodeType.Folder} />);
        expect(screen.queryByText(humanSize({ bytes: 999 }))).not.toBeInTheDocument();
    });
});
