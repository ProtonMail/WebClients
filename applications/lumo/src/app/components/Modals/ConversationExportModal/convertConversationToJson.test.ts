import type { Conversation } from '../../../types';
import { Role } from '../../../types';
import { CONVERSATION_ROOT_NODE_ID, convertConversationToJson } from './convertConversationToJson';
import { makeMessage, testBaseConversation, toMessageMap } from './exportConversation.fixtures';

describe('convertConversationToJson', () => {
    it('includes the conversation metadata, converted to ChatGPT field names/units', () => {
        const conversation: Conversation = { ...testBaseConversation, starred: true };
        const data = JSON.parse(convertConversationToJson(conversation, {}));

        expect(data).toMatchObject({
            conversation_id: 'conv-1',
            id: 'conv-1',
            title: 'Test Conversation',
            is_starred: true,
            create_time: new Date(testBaseConversation.createdAt).getTime() / 1000,
            update_time: new Date(testBaseConversation.updatedAt).getTime() / 1000,
        });
    });

    it('always includes a message-less root node', () => {
        const data = JSON.parse(convertConversationToJson(testBaseConversation, {}));
        expect(data.mapping[CONVERSATION_ROOT_NODE_ID]).toMatchObject({
            id: CONVERSATION_ROOT_NODE_ID,
            message: null,
            parent: null,
        });
    });

    it('maps a message to its ChatGPT node shape', () => {
        const message = makeMessage({
            id: 'msg-1',
            createdAt: '2026-01-01T00:00:10.000Z',
            role: Role.Assistant,
            content: 'Hi there',
            parentId: CONVERSATION_ROOT_NODE_ID,
        });
        const data = JSON.parse(convertConversationToJson(testBaseConversation, toMessageMap([message])));

        expect(data.mapping['msg-1']).toMatchObject({
            id: 'msg-1',
            message: {
                author: { name: null, role: 'assistant' },
                content: { content_type: 'text', parts: ['Hi there'] },
                create_time: new Date(message.createdAt).getTime() / 1000,
                id: 'msg-1',
            },
            parent: CONVERSATION_ROOT_NODE_ID,
        });
    });

    it('defaults a message with no parentId to the root node', () => {
        const message = makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', parentId: undefined });
        const data = JSON.parse(convertConversationToJson(testBaseConversation, toMessageMap([message])));

        expect(data.mapping['msg-1'].parent).toBe(CONVERSATION_ROOT_NODE_ID);
    });

    it.each([
        [Role.User, 'user'],
        [Role.Assistant, 'assistant'],
        [Role.System, 'system'],
        [Role.ToolCall, 'tool'],
        [Role.ToolResult, 'tool'],
    ])('converts Lumo role %s to ChatGPT author role %s', (role, expected) => {
        const message = makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z', role });
        const data = JSON.parse(convertConversationToJson(testBaseConversation, toMessageMap([message])));
        expect(data.mapping['msg-1'].message.author.role).toBe(expected);
    });

    it('excludes placeholder messages', () => {
        const messages = [
            makeMessage({ id: 'msg-1', createdAt: '2026-01-01T00:00:10.000Z' }),
            makeMessage({ id: 'msg-2', createdAt: '2026-01-01T00:00:20.000Z', placeholder: true }),
        ];
        const data = JSON.parse(convertConversationToJson(testBaseConversation, toMessageMap(messages)));

        expect(data.mapping['msg-1']).toBeDefined();
        expect(data.mapping['msg-2']).toBeUndefined();
    });

    it('sets current_node to the most recently created message, regardless of map iteration order', () => {
        const messages = [
            makeMessage({ id: 'msg-oldest', createdAt: '2026-01-01T00:00:30.000Z' }),
            makeMessage({ id: 'msg-newest', createdAt: '2026-01-01T00:05:00.000Z' }),
            makeMessage({ id: 'msg-middle', createdAt: '2026-01-01T00:02:00.000Z' }),
        ];
        const data = JSON.parse(convertConversationToJson(testBaseConversation, toMessageMap(messages)));

        expect(data.current_node).toBe('msg-newest');
    });
});
