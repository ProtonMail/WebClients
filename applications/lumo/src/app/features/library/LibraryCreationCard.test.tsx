import { fireEvent, render, screen } from '@testing-library/react';

import { LibraryCreationCard } from './LibraryCreationCard';
import type { LibraryCreationEntry } from './libraryCreations';

const navigate = jest.fn();
const downloadSource = jest.fn();

jest.mock('../../hooks/useLumoNavigate', () => {
    return { useLumoNavigate: () => navigate };
});
jest.mock('../../hooks/useIsLumoSmallScreen', () => {
    return { useIsLumoSmallScreen: () => ({ isSmallScreen: false }) };
});
jest.mock('../../hooks/useIsTouchDevice', () => {
    return { useIsTouchDevice: () => false };
});
jest.mock('../../redux/hooks', () => {
    return {
        useLumoSelector: () => ({
            id: 'asset-1',
            filename: 'Team Cost Calculator.ts',
            mimeType: 'text/plain;charset=utf-8',
            data: new TextEncoder().encode('export const cost = 1;'),
            generatedArtifactAsset: {
                conversationId: 'conversation-1',
                artifactId: 'calc',
                artifactType: 'code',
                artifactTitle: 'Team Cost Calculator',
            },
        }),
    };
});
jest.mock('./LibraryCreationThumbnail', () => {
    return { LibraryCreationThumbnail: () => null };
});
// The real exporters pull in ESM-only libraries Jest can't load; the menu wiring is what's tested.
jest.mock('../../components/Conversation/artifact/artifactSourceDownload', () => {
    return { getArtifactSourceDownloadMimeType: () => 'text/plain;charset=utf-8' };
});
jest.mock('../../components/Conversation/artifact/useArtifactFileActions', () => {
    return {
        useArtifactFileActions: () => ({
            downloadOptions: [
                { key: 'source', label: 'Source file', extension: '.ts', icon: 'FileCode', onSelect: downloadSource },
            ],
            saveToDriveOptions: [],
            exportingKind: null,
            exportFormatLabel: 'PDF',
            exportOverlayRef: { current: null },
            saveToDriveModal: null,
        }),
    };
});

const entry: LibraryCreationEntry = {
    item: { localId: 'asset-1', localSpaceId: 'space', remoteId: 'remote-1', createdAt: new Date('2026-10-12') },
    title: 'Team Cost Calculator',
    artifactType: 'code',
};

describe('LibraryCreationCard', () => {
    beforeEach(() => {
        navigate.mockClear();
        downloadSource.mockClear();
    });

    it('opens the menu from ⋯ without opening the chat', () => {
        render(<LibraryCreationCard entry={entry} />);
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Team Cost Calculator' }));

        expect(navigate).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Download'));
        expect(downloadSource).toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it('opens the chat from the title and from the menu', () => {
        render(<LibraryCreationCard entry={entry} />);
        fireEvent.click(screen.getByRole('button', { name: 'Open Team Cost Calculator in its chat' }));
        expect(navigate).toHaveBeenLastCalledWith('/c/conversation-1?artifact=calc');

        navigate.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Team Cost Calculator' }));
        fireEvent.click(screen.getByText('Open chat'));
        expect(navigate).toHaveBeenCalledWith('/c/conversation-1?artifact=calc');
    });
});
