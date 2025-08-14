/* eslint-disable custom-rules/deprecate-spacing-utility-classes */
import type { MessageFromApi, RemoteId, RemoteMessage } from '../remote/types';
import { StatusInt } from '../remote/types';
import { Role } from '../types';
import { topoSortMessagesFromApi, topoSortRemoteMessages } from './sorting';

describe('topoSortRemoteMessages', () => {
    it('should sort messages with parent-child relationships correctly', () => {
        const messages: RemoteMessage[] = [
            {
                id: '00000000-0000-4000-0003-000000000001',
                parentId: undefined,
                remoteId: 'm1',
                remoteParentId: undefined,
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.User,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
            {
                id: '00000000-0000-4000-0003-000000000002',
                remoteId: 'm2',
                remoteParentId: 'm1',
                parentId: '00000000-0000-4000-0003-000000000001',
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.Assistant,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
            {
                id: '00000000-0000-4000-0003-000000000003',
                remoteId: 'm3',
                remoteParentId: 'm2',
                parentId: '00000000-0000-4000-0003-000000000002',
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.User,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
            {
                id: '00000000-0000-4000-0003-000000000004',
                remoteId: 'm4',
                remoteParentId: 'm1',
                parentId: '00000000-0000-4000-0003-000000000001',
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.Assistant,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
            {
                id: '00000000-0000-4000-0003-000000000005',
                remoteId: 'm5',
                remoteParentId: undefined,
                parentId: undefined,
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.User,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
        ];

        const sortedMessages = topoSortRemoteMessages(messages);
        expectCorrect(
            sortedMessages,
            messages,
            (m) => m.id,
            (m) => m.parentId
        );
    });

    it('should handle messages with no parent', () => {
        const messages: RemoteMessage[] = [
            {
                id: '00000000-0000-4000-0003-000000000001',
                remoteId: 'm1',
                remoteParentId: undefined,
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.User,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
            {
                id: '00000000-0000-4000-0003-000000000002',
                remoteId: 'm2',
                remoteParentId: undefined,
                remoteConversationId: 'c1',
                createdAt: new Date().toISOString(),
                role: Role.User,
                conversationId: '00000000-0000-4000-0002-000000000001',
            },
        ];

        const sortedMessages = topoSortRemoteMessages(messages);
        expectCorrect(
            sortedMessages,
            messages,
            (m) => m.id,
            (m) => m.parentId
        );
    });
});

describe('topoSortMessagesFromApi', () => {
    it('should sort messages with parent-child relationships correctly', () => {
        const messages: MessageFromApi[] = [
            {
                ID: 'm1',
                ParentID: undefined,
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.User,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv1',
                    data: 'base64data1',
                },
                MessageTag: 'tag1',
            },
            {
                ID: 'm2',
                ParentID: 'm1',
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.Assistant,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv2',
                    data: 'base64data2',
                },
                MessageTag: 'tag2',
            },
            {
                ID: 'm3',
                ParentID: 'm2',
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.User,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv3',
                    data: 'base64data3',
                },
                MessageTag: 'tag3',
            },
            {
                ID: 'm4',
                ParentID: 'm1',
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.Assistant,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv4',
                    data: 'base64data4',
                },
                MessageTag: 'tag4',
            },
            {
                ID: 'm5',
                ParentID: undefined,
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.User,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv5',
                    data: 'base64data5',
                },
                MessageTag: 'tag5',
            },
        ];

        const sortedMessages = topoSortMessagesFromApi(messages);

        expectCorrect(
            sortedMessages,
            messages,
            (m) => m.ID as RemoteId,
            (m) => m.ParentID as RemoteId | undefined
        );
    });

    it('should handle messages with no parent', () => {
        const messages: MessageFromApi[] = [
            {
                ID: 'm1',
                ParentID: undefined,
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.User,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv1',
                    data: 'base64data1',
                },
                MessageTag: 'tag1',
            },
            {
                ID: 'm2',
                ParentID: undefined,
                ConversationID: 'c1',
                CreateTime: new Date().toISOString(),
                Role: Role.User,
                Status: StatusInt.Succeeded,
                Encrypted: {
                    iv: 'base64iv2',
                    data: 'base64data2',
                },
                MessageTag: 'tag2',
            },
        ];

        const sortedMessages = topoSortMessagesFromApi(messages);

        expectCorrect(
            sortedMessages,
            messages,
            (m) => m.ID as RemoteId,
            (m) => m.ParentID as RemoteId | undefined
        );
    });
});

// Returns whether the DAG dependencies are traversed in order in the input array.
// Dependencies are defined here by parent id, but in reality there can be conversation and space ids too,
// this is just not tested here.
function isSorted<T>(
    ms: T[],
    getId: (message: T) => string,
    getParentId: (message: T) => RemoteId | undefined | null
): boolean {
    const seen = new Set();
    for (const m of ms) {
        if (getParentId(m) && !seen.has(getParentId(m))) {
            return false;
        }
        seen.add(getId(m));
    }
    return true;
}

function expectCorrect<T>(
    sortedMessages: T[],
    messages: T[],
    getId: (message: T) => string,
    getParentId: (message: T) => string | undefined
) {
    // Check if the DAG dependencies are traversed in order
    expect(isSorted(sortedMessages, getId, getParentId));

    // Check if the length of sorted messages matches the original messages
    expect(sortedMessages.length).toBe(messages.length);

    // Check if every message in the original list is present in the sorted list
    expect(messages.every((m1) => sortedMessages.some((m2) => getId(m2) === getId(m1)))).toBe(true);

    // Check for duplicates in the sorted list
    expect(sortedMessages.every((m1) => sortedMessages.filter((m2) => getId(m2) === getId(m1)).length === 1)).toBe(
        true
    );
}
