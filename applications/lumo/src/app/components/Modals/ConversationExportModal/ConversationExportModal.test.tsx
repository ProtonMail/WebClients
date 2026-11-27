import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { BulkConversationExportResult } from '../../../redux/bulkConversationExport';
import {
    ChatHistoryNotLoadedError,
    EXPORT_LOG_FILENAME,
    prepareBulkConversationExport,
} from '../../../redux/bulkConversationExport';
import { LocalExportAvailableError, prepareConversationExport } from '../../../redux/sagas/conversationSnapshot';
import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { ConversationExportModal } from './ConversationExportModal';
import { exportConversation } from './exportConversation';
import { makeMessage, testBaseConversation, toMessageMap } from './exportConversation.fixtures';

const createNotification = vi.fn();

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification }),
}));
vi.mock('../../../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
vi.mock('../../../redux/hooks', () => ({ useLumoDispatch: () => (thunk: () => unknown) => thunk() }));

vi.mock(import('../../../redux/bulkConversationExport'), async (importOriginal) => ({
    ...(await importOriginal()),
    prepareBulkConversationExport: vi.fn(),
}));
vi.mock(import('../../../redux/sagas/conversationSnapshot'), async (importOriginal) => ({
    ...(await importOriginal()),
    prepareConversationExport: vi.fn(),
}));
vi.mock('../../../util/triggerFileDownload', () => ({ triggerFileDownload: vi.fn() }));
vi.mock(import('./exportConversation'), async (importOriginal) => ({
    ...(await importOriginal()),
    exportConversation: vi.fn(),
}));

const snapshot = {
    conversation: { ...testBaseConversation, title: 'Updated conversation' },
    messages: toMessageMap([makeMessage({ id: 'message-1' })]),
};
const project = { id: 'project-1', title: 'Project Notes' };

const clickExport = () => fireEvent.click(screen.getByRole('button', { name: 'Export' }));

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(exportConversation).mockResolvedValue(undefined);
    vi.mocked(triggerFileDownload).mockResolvedValue(undefined);
});

describe('ConversationExportModal', () => {
    it('exports the prepared conversation in the selected format and closes on success', async () => {
        const onClose = vi.fn();
        vi.mocked(prepareConversationExport).mockReturnValue(async () => snapshot);
        render(<ConversationExportModal open conversation={testBaseConversation} onClose={onClose} />);

        expect(screen.getByRole('radio', { name: /^JSON/ })).toBeChecked();
        fireEvent.click(screen.getByRole('radio', { name: /^Markdown/ }));
        clickExport();

        expect(prepareConversationExport).toHaveBeenCalledWith(
            testBaseConversation.id,
            false,
            expect.any(AbortSignal),
            false
        );
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(exportConversation).toHaveBeenCalledWith(snapshot.conversation, snapshot.messages, 'md');
        expect(createNotification).toHaveBeenCalledWith({ text: 'Conversation exported', type: 'success' });
    });

    it('reports a transcript with only placeholders as empty and leaves the modal open', async () => {
        const onClose = vi.fn();
        vi.mocked(prepareConversationExport).mockReturnValue(async () => ({
            ...snapshot,
            messages: toMessageMap([makeMessage({ id: 'placeholder', placeholder: true })]),
        }));
        render(<ConversationExportModal open conversation={testBaseConversation} onClose={onClose} />);

        clickExport();

        await waitFor(() =>
            expect(createNotification).toHaveBeenCalledWith({
                text: 'This chat has no messages to export.',
                type: 'error',
            })
        );
        expect(exportConversation).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('requires an explicit retry before exporting only locally available messages', async () => {
        vi.mocked(prepareConversationExport)
            .mockReturnValueOnce(async () => {
                throw new LocalExportAvailableError();
            })
            .mockReturnValueOnce(async () => snapshot);
        render(<ConversationExportModal open conversation={testBaseConversation} />);

        clickExport();

        const retry = await screen.findByRole('button', { name: 'Export available messages' });
        expect(screen.getByRole('status')).toHaveTextContent('The export may be incomplete.');
        expect(exportConversation).not.toHaveBeenCalled();

        fireEvent.click(retry);

        expect(prepareConversationExport).toHaveBeenLastCalledWith(
            testBaseConversation.id,
            false,
            expect.any(AbortSignal),
            true
        );
        await waitFor(() =>
            expect(exportConversation).toHaveBeenCalledWith(snapshot.conversation, snapshot.messages, 'json')
        );
    });

    it('shows account export progress and downloads the ZIP when preparation finishes', async () => {
        const pending = Promise.withResolvers<BulkConversationExportResult>();
        vi.mocked(prepareBulkConversationExport).mockReturnValue(() => pending.promise);
        render(<ConversationExportModal open allChats />);

        clickExport();

        expect(prepareBulkConversationExport).toHaveBeenCalledWith(
            undefined,
            expect.any(AbortSignal),
            'json',
            expect.any(Function)
        );
        const [, , , onProgress] = vi.mocked(prepareBulkConversationExport).mock.calls[0];
        act(() => onProgress?.({ completed: 2, total: 5 }));

        const progress = screen.getByRole('progressbar', { name: 'Preparing export…' });
        expect(progress).toHaveAttribute('value', '2');
        expect(progress).toHaveAttribute('max', '5');
        expect(progress).toHaveAttribute('aria-valuetext', '2 of 5 chats prepared');
        expect(screen.getByRole('radio', { name: /^Markdown/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Preparing export…' })).toBeDisabled();
        expect(triggerFileDownload).not.toHaveBeenCalled();

        const file = new Blob();
        await act(async () => pending.resolve({ count: 5, issues: 0, file }));

        expect(triggerFileDownload).toHaveBeenCalledWith(file, 'lumo-chats.zip');
        expect(createNotification).toHaveBeenCalledWith({ text: 'Chats exported', type: 'success' });
    });

    it('exports only the selected project and warns when the archive contains incomplete chats', async () => {
        const file = new Blob();
        vi.mocked(prepareBulkConversationExport).mockReturnValue(async () => ({
            count: 2,
            issues: 1,
            file,
        }));
        render(<ConversationExportModal open project={project} />);

        fireEvent.click(screen.getByRole('radio', { name: /^Markdown/ }));
        clickExport();

        expect(prepareBulkConversationExport).toHaveBeenCalledWith(
            project.id,
            expect.any(AbortSignal),
            'md',
            expect.any(Function)
        );
        await waitFor(() =>
            expect(createNotification).toHaveBeenCalledWith({
                text: `Chats exported. Some chats are incomplete; see ${EXPORT_LOG_FILENAME}.`,
                type: 'warning',
            })
        );
        expect(triggerFileDownload).toHaveBeenCalledWith(file, 'Project Notes-chats.zip');
    });

    it.each([
        { issues: 0, text: 'This project has no chats to export.' },
        { issues: 1, text: "Couldn't export chat history. Try again." },
    ])('shows the appropriate error for a ZIP with no chats and $issues issue(s)', async ({ issues, text }) => {
        vi.mocked(prepareBulkConversationExport).mockReturnValue(async () => ({
            count: 0,
            issues,
            file: new Blob(),
        }));
        render(<ConversationExportModal open project={project} />);

        clickExport();

        await waitFor(() => expect(createNotification).toHaveBeenCalledWith({ text, type: 'error' }));
        expect(triggerFileDownload).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
    });

    it.each([
        { loading: true, text: 'Your chat history is still loading. Try again in a moment.', type: 'info' },
        {
            loading: false,
            text: "Couldn't load your chat history. Check your connection and try again.",
            type: 'error',
        },
    ])('shows a $type toast when history is unavailable (loading: $loading)', async ({ loading, text, type }) => {
        vi.mocked(prepareBulkConversationExport).mockReturnValue(async () => {
            throw new ChatHistoryNotLoadedError(loading);
        });
        render(<ConversationExportModal open allChats />);

        clickExport();

        await waitFor(() => expect(createNotification).toHaveBeenCalledWith({ text, type }));
        expect(triggerFileDownload).not.toHaveBeenCalled();
    });

    it('shows an error and allows a retry when the download fails', async () => {
        const onClose = vi.fn();
        vi.mocked(prepareConversationExport).mockReturnValue(async () => snapshot);
        vi.mocked(exportConversation).mockRejectedValueOnce(new Error('Download failed'));
        render(<ConversationExportModal open conversation={testBaseConversation} onClose={onClose} />);

        clickExport();

        await waitFor(() =>
            expect(createNotification).toHaveBeenCalledWith({
                text: "Couldn't export this chat. Try again.",
                type: 'error',
            })
        );
        expect(onClose).not.toHaveBeenCalled();

        clickExport();

        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(exportConversation).toHaveBeenCalledTimes(2);
    });

    it('aborts preparation on close and ignores a late result', async () => {
        const onClose = vi.fn();
        const pending = Promise.withResolvers<BulkConversationExportResult>();
        vi.mocked(prepareBulkConversationExport).mockReturnValue(() => pending.promise);
        render(<ConversationExportModal open allChats onClose={onClose} />);

        clickExport();
        const [, signal] = vi.mocked(prepareBulkConversationExport).mock.calls[0];
        fireEvent.click(screen.getByTestId('modal:close'));

        expect(signal.aborted).toBe(true);
        expect(onClose).toHaveBeenCalledOnce();
        await act(async () => pending.resolve({ count: 1, issues: 0, file: new Blob() }));

        expect(triggerFileDownload).not.toHaveBeenCalled();
        expect(createNotification).not.toHaveBeenCalled();
    });
});
