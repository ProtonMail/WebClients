import type { LumoState } from '../../../redux/store';
import type { Conversation, Message } from '../../../types';
import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { convertConversationToJson } from './convertConversationToJson';
import { convertConversationToMarkdown } from './convertConversationToMarkdown';
import { exportConversation } from './exportConversation';
import { makeMessage, testBaseConversation, toMessageMap } from './exportConversation.fixtures';

jest.mock('../../../util/triggerFileDownload', () => ({ triggerFileDownload: jest.fn() }));

const makeState = (messages: Message[]): LumoState => ({ messages: toMessageMap(messages) }) as LumoState;

describe('exportConversation', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('downloads a JSON file with an application/json blob and a sanitized filename', async () => {
        const messages = [makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', content: 'Hi there' })];
        exportConversation(makeState(messages), testBaseConversation, 'json');

        expect(triggerFileDownload).toHaveBeenCalledTimes(1);
        const [blob, filename] = (triggerFileDownload as jest.Mock).mock.calls[0];

        expect(filename).toBe('Test Conversation.json');
        expect(blob.type).toBe('application/json');
        expect(await blob.text()).toBe(convertConversationToJson(testBaseConversation, toMessageMap(messages)));
    });

    it('downloads a markdown file with a text/markdown blob and a sanitized filename', async () => {
        const messages = [makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', content: 'Hi there' })];
        exportConversation(makeState(messages), testBaseConversation, 'md');

        expect(triggerFileDownload).toHaveBeenCalledTimes(1);
        const [blob, filename] = (triggerFileDownload as jest.Mock).mock.calls[0];

        expect(filename).toBe('Test Conversation.md');
        expect(blob.type).toBe('text/markdown');
        expect(await blob.text()).toBe(convertConversationToMarkdown(testBaseConversation, toMessageMap(messages)));
    });

    it('strips characters that are illegal in filenames on Windows/macOS/Linux', () => {
        const conversation: Conversation = { ...testBaseConversation, title: 'Q&A: "Best" Tips?' };
        exportConversation(makeState([]), conversation, 'json');

        const [, filename] = (triggerFileDownload as jest.Mock).mock.calls[0];
        expect(filename).toBe('Q&A Best Tips.json');
    });

    it('trims trailing dots and spaces from the sanitized filename', () => {
        const conversation: Conversation = { ...testBaseConversation, title: 'Draft Notes...   ' };
        exportConversation(makeState([]), conversation, 'json');

        const [, filename] = (triggerFileDownload as jest.Mock).mock.calls[0];
        expect(filename).toBe('Draft Notes.json');
    });

    it('falls back to a default filename when the title sanitizes to an empty string', () => {
        const conversation: Conversation = { ...testBaseConversation, title: '/\\:*?"<>|' };
        exportConversation(makeState([]), conversation, 'md');

        const [, filename] = (triggerFileDownload as jest.Mock).mock.calls[0];
        expect(filename).toBe('Untitled conversation.md');
    });

    it('only exports messages belonging to the requested conversation', async () => {
        const messages = [
            makeMessage({
                id: 'msg-1',
                createdAt: '2026-01-01T00:00:10.000Z',
                content: 'mine',
                conversationId: 'conv-1',
            }),
            makeMessage({
                id: 'msg-2',
                createdAt: '2026-01-01T00:00:20.000Z',
                content: 'other',
                conversationId: 'conv-2',
            }),
        ];
        exportConversation(makeState(messages), testBaseConversation, 'md');

        const [blob] = (triggerFileDownload as jest.Mock).mock.calls[0];
        const text = await blob.text();
        expect(text).toContain('mine');
        expect(text).not.toContain('other');
    });
});
