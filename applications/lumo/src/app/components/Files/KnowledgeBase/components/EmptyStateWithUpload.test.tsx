import { fireEvent, render, screen } from '@testing-library/react';

import { EmptyStateWithUpload } from './EmptyStateWithUpload';

const handleFilesSelected = jest.fn();
const mockFlags = { artifactsView: true };

jest.mock('../../../../hooks/useLumoFlags', () => {
    return { useLumoFlags: () => mockFlags };
});
jest.mock('../../../Composer/hooks/useFileHandling', () => {
    return { useFileHandling: () => ({ handleFilesSelected }) };
});
jest.mock('../../../../util/telemetry', () => {
    return { sendFileUploadEvent: jest.fn() };
});

const renderEmptyState = () => {
    const onShowDriveBrowser = jest.fn();
    const { container } = render(
        <EmptyStateWithUpload messageChain={[]} onShowDriveBrowser={onShowDriveBrowser} spaceId="space" />
    );
    return { onShowDriveBrowser, container };
};

describe('EmptyStateWithUpload', () => {
    beforeEach(() => {
        handleFilesSelected.mockClear();
        mockFlags.artifactsView = true;
    });

    it('keeps the original empty state while the artifacts flag is off', () => {
        mockFlags.artifactsView = false;
        const { onShowDriveBrowser } = renderEmptyState();

        expect(screen.queryByText('No files or creations yet')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add from computer' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Add from Drive' }));
        expect(onShowDriveBrowser).toHaveBeenCalledTimes(1);
    });

    it('shows the heading, description and both actions', () => {
        renderEmptyState();

        expect(screen.getByText('No files or creations yet')).toBeInTheDocument();
        expect(screen.getByText(/creations from this chat will appear here\./)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add from Drive' })).toBeInTheDocument();
    });

    it('opens the Drive browser from "Add from Drive"', () => {
        const { onShowDriveBrowser } = renderEmptyState();

        fireEvent.click(screen.getByRole('button', { name: 'Add from Drive' }));
        expect(onShowDriveBrowser).toHaveBeenCalledTimes(1);
    });

    it('opens the file picker from "Upload" and passes chosen files on', () => {
        const { container } = renderEmptyState();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = jest.spyOn(input, 'click');

        fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
        expect(clickSpy).toHaveBeenCalledTimes(1);

        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        fireEvent.change(input, { target: { files: [file] } });
        expect(handleFilesSelected).toHaveBeenCalledWith([file]);
    });
});
