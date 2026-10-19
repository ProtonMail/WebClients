import type { ReactNode } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { buildArtifactSourceDownloadFile } from '../../Conversation/artifact/artifactSourceDownload';
import type { ConversationArtifactDrawerEntry } from '../../Conversation/artifact/conversationArtifactDrawerList';
import { KnowledgeBaseArtifactsSection } from './KnowledgeBaseArtifactsSection';

const mockCreateNotification = jest.fn();

jest.mock('@proton/app-context/useNotifications', () => {
    return {
        useNotifications: () => {
            return { createNotification: mockCreateNotification };
        },
    };
});

jest.mock('../../../util/triggerFileDownload', () => {
    return { triggerFileDownload: jest.fn() };
});

jest.mock('../../Conversation/artifact/ArtifactChipShell', () => {
    return {
        ArtifactChipShell: ({
            title,
            onClick,
            actions,
        }: {
            title: string;
            onClick: () => void;
            actions: ReactNode;
        }) => {
            return (
                <div>
                    <button type="button" onClick={onClick}>
                        {title}
                    </button>
                    {actions}
                </div>
            );
        },
    };
});

jest.mock('../../Conversation/artifact/artifactDrawerTypeLabel', () => {
    return {
        getArtifactDrawerTypeLabel: () => {
            return 'Code';
        },
    };
});

jest.mock('../../Conversation/artifact/artifactSourceDownload', () => {
    return { buildArtifactSourceDownloadFile: jest.fn() };
});

const buildFileMock = buildArtifactSourceDownloadFile as jest.Mock;
const triggerFileDownloadMock = triggerFileDownload as jest.Mock;

const artifact = {
    id: 'artifact-1',
    type: 'code',
    title: 'Snippet',
    content: 'console.log(1);',
    language: 'javascript',
} as ConversationArtifactDrawerEntry;

const renderSection = () => {
    const onOpenArtifact = jest.fn();
    render(<KnowledgeBaseArtifactsSection artifacts={[artifact]} onOpenArtifact={onOpenArtifact} />);
    return { onOpenArtifact };
};

describe('KnowledgeBaseArtifactsSection download', () => {
    beforeEach(() => {
        mockCreateNotification.mockReset();
        buildFileMock.mockReset();
        triggerFileDownloadMock.mockReset();
    });

    it('downloads the source file without opening the creation', async () => {
        buildFileMock.mockResolvedValue({
            data: 'console.log(1);',
            fileName: 'snippet.js',
            mimeType: 'text/javascript',
        });
        triggerFileDownloadMock.mockResolvedValue(undefined);
        const { onOpenArtifact } = renderSection();

        fireEvent.click(screen.getByRole('button', { name: 'Download' }));

        await waitFor(() => {
            expect(triggerFileDownloadMock).toHaveBeenCalledWith(expect.any(Blob), 'snippet.js');
        });
        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(onOpenArtifact).not.toHaveBeenCalled();
    });

    it('shows an error notification when building the file fails', async () => {
        buildFileMock.mockRejectedValue(new Error('empty content'));
        renderSection();

        fireEvent.click(screen.getByRole('button', { name: 'Download' }));

        await waitFor(() => {
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Could not download this file.',
            });
        });
        expect(triggerFileDownloadMock).not.toHaveBeenCalled();
    });

    it('shows an error notification when the download fails', async () => {
        buildFileMock.mockResolvedValue({ data: 'x', fileName: 'snippet.js', mimeType: 'text/javascript' });
        triggerFileDownloadMock.mockRejectedValue(new Error('blocked'));
        renderSection();

        fireEvent.click(screen.getByRole('button', { name: 'Download' }));

        await waitFor(() => {
            expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        });
    });
});
