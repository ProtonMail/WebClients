import { Role } from '../../../types';
import { convertConversationToMarkdown } from './convertConversationToMarkdown';
import { makeMessage, testBaseConversation, toMessageMap } from './exportConversation.fixtures';

describe('convertConversationToMarkdown', () => {
    it('renders a sample conversation as markdown', () => {
        const messages = toMessageMap([
            makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', role: Role.User, content: 'Hi there' }),
            makeMessage({
                id: 'msg-2',
                createdAt: '2026-01-01T00:00:20.000Z',
                role: Role.ToolCall,
                content: '{"tool":"search"}',
            }),
        ]);
        const result = convertConversationToMarkdown(testBaseConversation, messages);

        expect(result).toMatchInlineSnapshot(`
            "Test Conversation
            =================

            **USER:**
            Hi there

            **TOOL_CALL:**
            {"tool":"search"}"
        `);
    });

    it('orders messages chronologically regardless of map iteration order', () => {
        const messages = [
            makeMessage({ id: 'msg-oldest', createdAt: '2026-01-01T00:00:30.000Z', content: 'oldest' }),
            makeMessage({ id: 'msg-newest', createdAt: '2026-01-01T00:05:00.000Z', content: 'newest' }),
            makeMessage({ id: 'msg-middle', createdAt: '2026-01-01T00:02:00.000Z', content: 'middle' }),
        ];
        const result = convertConversationToMarkdown(testBaseConversation, toMessageMap(messages));

        expect(result.indexOf('oldest')).toBeLessThan(result.indexOf('middle'));
        expect(result.indexOf('middle')).toBeLessThan(result.indexOf('newest'));
    });

    it('excludes placeholder messages', () => {
        const messages = [
            makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', content: 'kept' }),
            makeMessage({ id: 'msg-2', createdAt: '2026-01-01T00:00:20.000Z', content: 'dropped', placeholder: true }),
        ];
        const result = convertConversationToMarkdown(testBaseConversation, toMessageMap(messages));

        expect(result).toContain('kept');
        expect(result).not.toContain('dropped');
    });
});
