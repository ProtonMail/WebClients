import type { Mock } from 'vitest';

import { prepareConversationExport } from '../../../redux/sagas/conversationSnapshot';
import type { LumoState } from '../../../redux/store';
import type { LumoThunkArguments } from '../../../redux/thunk';
import type { Conversation } from '../../../types';
import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { convertConversationToJson } from './convertConversationToJson';
import { convertConversationToMarkdown } from './convertConversationToMarkdown';
import { exportConversation } from './exportConversation';
import { makeMessage, testBaseConversation, toMessageMap } from './exportConversation.fixtures';

vi.mock('../../../util/triggerFileDownload', () => ({ triggerFileDownload: vi.fn() }));

describe('exportConversation', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('downloads a JSON file with an application/json blob and a sanitized filename', async () => {
        const messages = [makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', content: 'Hi there' })];
        exportConversation(testBaseConversation, toMessageMap(messages), 'json');

        expect(triggerFileDownload).toHaveBeenCalledTimes(1);
        const [blob, filename] = (triggerFileDownload as Mock).mock.calls[0];

        expect(filename).toBe('Test Conversation.json');
        expect(blob.type).toBe('application/json');
        expect(await blob.text()).toBe(convertConversationToJson(testBaseConversation, toMessageMap(messages)));
    });

    it('downloads a markdown file with a text/markdown blob and a sanitized filename', async () => {
        const messages = [makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', content: 'Hi there' })];
        exportConversation(testBaseConversation, toMessageMap(messages), 'md');

        expect(triggerFileDownload).toHaveBeenCalledTimes(1);
        const [blob, filename] = (triggerFileDownload as Mock).mock.calls[0];

        expect(filename).toBe('Test Conversation.md');
        expect(blob.type).toBe('text/markdown');
        expect(await blob.text()).toBe(convertConversationToMarkdown(testBaseConversation, toMessageMap(messages)));
    });

    it('strips characters that are illegal in filenames on Windows/macOS/Linux', () => {
        const conversation: Conversation = { ...testBaseConversation, title: 'Q&A: "Best" Tips?' };
        exportConversation(conversation, {}, 'json');

        const [, filename] = (triggerFileDownload as Mock).mock.calls[0];
        expect(filename).toBe('Q&A Best Tips.json');
    });

    it('trims trailing dots and spaces from the sanitized filename', () => {
        const conversation: Conversation = { ...testBaseConversation, title: 'Draft Notes...   ' };
        exportConversation(conversation, {}, 'json');

        const [, filename] = (triggerFileDownload as Mock).mock.calls[0];
        expect(filename).toBe('Draft Notes.json');
    });

    it('falls back to a default filename when the title sanitizes to an empty string', () => {
        const conversation: Conversation = { ...testBaseConversation, title: '/\\:*?"<>|' };
        exportConversation(conversation, {}, 'md');

        const [, filename] = (triggerFileDownload as Mock).mock.calls[0];
        expect(filename).toBe('Untitled conversation.md');
    });

    it('only exports messages belonging to the requested conversation', async () => {
        const messages = [
            makeMessage({ id: 'msg-1', content: 'mine', conversationId: 'conv-1' }),
            makeMessage({ id: 'msg-2', content: 'other', conversationId: 'conv-2' }),
        ];
        const getState = () =>
            ({
                conversations: { [testBaseConversation.id]: testBaseConversation },
                messages: toMessageMap(messages),
            }) as LumoState;
        const snapshot = await prepareConversationExport(testBaseConversation.id, true)(
            vi.fn(),
            getState,
            {} as LumoThunkArguments
        );

        await exportConversation(snapshot.conversation, snapshot.messages, 'md');
        const [blob] = (triggerFileDownload as Mock).mock.calls[0];
        const text = await blob.text();
        expect(text).toContain('mine');
        expect(text).not.toContain('other');
    });
});
