import { act, renderHook, waitFor } from '@testing-library/react';

import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { PromiseHandlers } from '../usePromise';
import { useSwitchToPlainText } from './useSwitchToPlainText';

const mockApi = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const logo = { ID: 'logo', Name: 'logo.png', Headers: { 'content-id': '<logo@example.com>' } } as Attachment;
const badge = { ID: 'badge', Name: 'badge.png', Headers: { 'content-id': '<badge@example.com>' } } as Attachment;
const report = { ID: 'report', Name: 'report.pdf', Headers: {} } as Attachment;

const getEmbeddedImage = (attachment: Attachment) => ({
    type: 'embedded' as const,
    id: `embedded-${attachment.ID}`,
    cid: `${attachment.ID}@example.com`,
    cloc: '',
    attachment,
    status: 'loaded' as const,
    tracker: undefined,
});

const getMessage = (ID: string | undefined): MessageState => ({
    localID: 'localID',
    data: { ID, MIMEType: MIME_TYPES.DEFAULT, Attachments: [logo, badge, report] } as MessageState['data'],
    messageImages: {
        hasEmbeddedImages: true,
        hasRemoteImages: false,
        showEmbeddedImages: true,
        showRemoteImages: false,
        trackersStatus: 'loaded',
        images: [getEmbeddedImage(logo), getEmbeddedImage(badge)],
    },
});

const getPendingSave = (isPending: boolean) => ({ isPending }) as PromiseHandlers<void>;

const setup = (initialProps: { modelMessage: MessageState; syncedMessageID?: string; isSaving?: boolean }) => {
    const onChange = jest.fn();
    const setBlockquoteExpanded = jest.fn();
    const removeEmbedded = jest.fn();
    let modelMessage = initialProps.modelMessage;

    const hook = renderHook(
        ({ modelMessage: message, syncedMessageID, isSaving = false }: typeof initialProps) => {
            modelMessage = message;
            return useSwitchToPlainText({
                modelMessage: message,
                getModelMessage: () => modelMessage,
                syncedMessageID,
                pendingSave: getPendingSave(isSaving),
                editorRef: { current: { removeEmbedded } as any },
                onChange,
                setBlockquoteExpanded,
            });
        },
        { initialProps }
    );

    return { ...hook, onChange, setBlockquoteExpanded, removeEmbedded };
};

const isSwitchToPlainText = (change: unknown) =>
    (change as Partial<MessageState>)?.data?.MIMEType === MIME_TYPES.PLAINTEXT;

describe('useSwitchToPlainText', () => {
    beforeEach(() => {
        mockApi.mockReset();
        mockCreateNotification.mockReset();
    });

    it('should delete the embedded images of a saved draft before switching', async () => {
        mockApi.mockResolvedValue({});
        const { result, onChange, setBlockquoteExpanded } = setup({
            modelMessage: getMessage('messageID'),
            syncedMessageID: 'messageID',
        });

        act(() => result.current.handleSwitchToPlainText(() => '<div>content</div>'));

        await waitFor(() => expect(onChange).toHaveBeenCalled());
        expect(mockApi).toHaveBeenCalledTimes(2);
        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({ url: 'mail/v4/attachments/logo', params: { MessageID: 'messageID' } })
        );
        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ url: 'mail/v4/attachments/badge' }));
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                messageDocument: { plainText: 'content' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT, Attachments: [report] },
            })
        );
        expect(setBlockquoteExpanded).toHaveBeenCalledWith(true);
    });

    it('should switch without any request when the draft is not saved yet', async () => {
        const { result, onChange } = setup({ modelMessage: getMessage(undefined) });

        act(() => result.current.handleSwitchToPlainText(() => ''));

        await waitFor(() => expect(onChange).toHaveBeenCalled());
        expect(mockApi).not.toHaveBeenCalled();
        expect(isSwitchToPlainText(onChange.mock.calls[0][0])).toBe(true);
    });

    it('should wait for the draft creation to reach the model before switching', async () => {
        mockApi.mockResolvedValue({});
        const { result, rerender, onChange } = setup({ modelMessage: getMessage(undefined), isSaving: true });

        act(() => result.current.handleSwitchToPlainText(() => ''));

        // The creation request is done, but the model does not have the server draft yet
        rerender({ modelMessage: getMessage(undefined), syncedMessageID: 'messageID' });
        await act(() => Promise.resolve());
        expect(onChange).not.toHaveBeenCalled();
        expect(mockApi).not.toHaveBeenCalled();

        rerender({ modelMessage: getMessage('messageID'), syncedMessageID: 'messageID' });

        await waitFor(() => expect(onChange).toHaveBeenCalled());
        expect(mockApi).toHaveBeenCalledTimes(2);
        expect(isSwitchToPlainText(onChange.mock.calls[0][0])).toBe(true);
    });

    it('should not keep the send waiting when the composer closes before the switch starts', async () => {
        const { result, unmount, onChange } = setup({ modelMessage: getMessage(undefined), isSaving: true });

        act(() => result.current.handleSwitchToPlainText(() => ''));
        const { promise } = result.current.pendingSwitch;

        unmount();

        await expect(promise).resolves.toBeUndefined();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('should stay in HTML and only drop the deleted images when a delete fails', async () => {
        mockApi.mockImplementation(({ url }) =>
            url.endsWith('/badge') ? Promise.reject(new Error('network')) : Promise.resolve({})
        );
        const { result, onChange, setBlockquoteExpanded, removeEmbedded } = setup({
            modelMessage: getMessage('messageID'),
            syncedMessageID: 'messageID',
        });

        act(() => result.current.handleSwitchToPlainText(() => ''));

        await waitFor(() => expect(mockCreateNotification).toHaveBeenCalled());
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        expect(setBlockquoteExpanded).not.toHaveBeenCalled();
        expect(removeEmbedded).toHaveBeenCalledTimes(1);
        expect(removeEmbedded).toHaveBeenCalledWith(logo);

        expect(onChange).toHaveBeenCalledTimes(1);
        const update = onChange.mock.calls[0][0] as (message: MessageState) => Partial<MessageState>;
        const change = update(getMessage('messageID'));
        expect(isSwitchToPlainText(change)).toBe(false);
        expect(change.data?.Attachments).toEqual([badge, report]);
        expect(change.messageImages?.images.map(({ id }) => id)).toEqual(['embedded-badge']);
    });
});
