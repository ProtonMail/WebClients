import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useHistory } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';

import type { DesktopToolApprovalRequest } from '@proton/lumo-api-client/core/desktop-tools';
import {
    getPendingToolApprovals,
    isDesktopEnvironment,
    subscribeToolApprovals,
} from '@proton/lumo-api-client/core/desktop-tools';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { ASK_USER_QUESTIONS_TOOL_NAME } from '../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import { CREATE_SCHEDULE_TOOL_NAME } from '../features/client-tools/createScheduleTool/createScheduleTool';
import conversationsReducer, { addConversation, changeConversationTitle } from '../redux/slices/core/conversations';
import messagesReducer, { addMessage, appendChunk, setToolResult } from '../redux/slices/core/messages';
import type { Conversation, Message, ToolCallBlock, ToolResultBlock } from '../types';
import { Role } from '../types';
import {
    ConversationAttentionProvider,
    getGroupAttentionKey,
    useAttentionKeys,
    useConversationAttention,
} from './ConversationAttentionProvider';

jest.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    ...jest.requireActual('@proton/lumo-api-client/core/desktop-tools'),
    getPendingToolApprovals: jest.fn(),
    isDesktopEnvironment: jest.fn(),
    subscribeToolApprovals: jest.fn(),
}));

const createdAt = '2026-01-01T09:00:00Z';
const nextTurnAt = '2026-01-01T09:01:00Z';

const chat: Conversation = { id: 'chat', spaceId: 'space', title: 'Chat', createdAt, updatedAt: createdAt };
const secondChat: Conversation = { ...chat, id: 'second-chat', title: 'Second chat' };

const questionArguments = {
    questions: [
        {
            id: 'q1',
            type: 'choice',
            title: 'When should this run?',
            allowMultiple: false,
            options: [{ id: 'morning', label: 'Morning' }],
        },
    ],
};

const success = JSON.stringify({ ok: true, message: 'Ready for review' });

function toolCall(id: string, name: string, args: unknown): ToolCallBlock {
    return { type: 'tool_call', content: JSON.stringify({ id, name, arguments: args }) };
}

function toolResult(id: string, content = success): ToolResultBlock {
    return { type: 'tool_result', tool_call_id: id, content };
}

function questionMessage(id: string, callId: string) {
    return {
        id,
        conversationId: chat.id,
        createdAt,
        role: Role.Assistant,
        blocks: [toolCall(callId, ASK_USER_QUESTIONS_TOOL_NAME, questionArguments), toolResult(callId)],
    } satisfies Message;
}

function approval(requestId: string, conversationId?: string): DesktopToolApprovalRequest {
    return { requestId, conversationId, connectorId: 'calendar', toolName: 'read_events', input: {} };
}

interface SetupOptions {
    conversations?: Conversation[];
    messages?: Message[];
    desktop?: boolean;
    path?: string;
}

function setup({ conversations = [chat], messages = [], desktop = false, path = '/' }: SetupOptions = {}) {
    let approvals: DesktopToolApprovalRequest[] = [];
    const listeners = new Set<() => void>();
    jest.mocked(isDesktopEnvironment).mockReturnValue(desktop);
    jest.mocked(getPendingToolApprovals).mockImplementation(() => approvals);
    jest.mocked(subscribeToolApprovals).mockImplementation((listener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    });

    const store = configureStore({
        reducer: { conversations: conversationsReducer, messages: messagesReducer },
        preloadedState: {
            conversations: Object.fromEntries(conversations.map((conversation) => [conversation.id, conversation])),
            messages: Object.fromEntries(messages.map((message) => [message.id, message])),
        },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store} context={ProtonStoreContext}>
            <MemoryRouter initialEntries={[path]}>
                <ConversationAttentionProvider>{children}</ConversationAttentionProvider>
            </MemoryRouter>
        </Provider>
    );
    const { result } = renderHook(
        () => ({ ...useAttentionKeys(), chatAttention: useConversationAttention(chat.id), history: useHistory() }),
        { wrapper }
    );

    return {
        result,
        store,
        navigate: (nextPath: string) => act(() => result.current.history.push(nextPath)),
        publishApprovals: (...requests: DesktopToolApprovalRequest[]) =>
            act(() => {
                approvals = requests;
                listeners.forEach((listener) => listener());
            }),
    };
}

it('waits for the matching successful result when a question streams in', () => {
    const message = questionMessage('reply', 'question');
    const [call] = message.blocks;
    const { result, store } = setup({ messages: [{ ...message, blocks: [call, toolResult('different-call')] }] });

    expect(result.current.byConversation.size).toBe(0);
    expect(result.current.bySpace.size).toBe(0);

    act(() => {
        store.dispatch(setToolResult({ messageId: message.id, callId: 'question', content: success }));
    });

    expect(result.current.chatAttention).toBe('card:reply:question');
    expect(result.current.bySpace.get(chat.spaceId)).toEqual({ conversationId: chat.id, key: 'card:reply:question' });
});

it('keeps the attention context stable for text chunks and updates it as soon as a matching result arrives', async () => {
    const message = questionMessage('reply', 'first-question');
    const nextCall = toolCall('next-question', ASK_USER_QUESTIONS_TOOL_NAME, questionArguments);
    const { result, store } = setup({ messages: [{ ...message, blocks: [...message.blocks, nextCall] }] });
    const beforeChunk = result.current;
    expect(beforeChunk.chatAttention).toBe('card:reply:first-question');
    const onStoreUpdate = jest.fn();
    const unsubscribe = store.subscribe(onStoreUpdate);

    act(() => {
        store.dispatch(appendChunk({ messageId: message.id, content: 'A streamed introduction.' }));
    });
    // Text dispatches are batched. Let Redux notify subscribers before checking that the hook did not render.
    await waitFor(() => expect(onStoreUpdate).toHaveBeenCalledTimes(1));
    unsubscribe();
    expect(result.current).toBe(beforeChunk);

    act(() => {
        store.dispatch(setToolResult({ messageId: message.id, callId: 'next-question', content: success }));
    });

    expect(result.current.chatAttention).toBe('card:reply:next-question');
    expect(result.current.bySpace.get(chat.spaceId)).toEqual({
        conversationId: chat.id,
        key: 'card:reply:next-question',
    });
});

it('keeps the attention context stable when a pending conversation title changes', () => {
    const { result, store } = setup({ messages: [questionMessage('reply', 'question')] });
    const beforeTitle = result.current;

    act(() => {
        store.dispatch(
            changeConversationTitle({ id: chat.id, spaceId: chat.spaceId, title: 'Streamed title', persist: false })
        );
    });

    expect(store.getState().conversations[chat.id].title).toBe('Streamed title');
    expect(result.current).toBe(beforeTitle);
});

it('restores an acknowledged question from legacy message fields', () => {
    const message: Message = {
        id: 'restored-reply',
        conversationId: chat.id,
        createdAt,
        role: Role.Assistant,
        toolCall: JSON.stringify({ name: ASK_USER_QUESTIONS_TOOL_NAME, arguments: questionArguments }),
        toolResult: success,
    };
    const { result } = setup({ messages: [message] });

    expect(result.current.chatAttention).toBe('card:restored-reply:0');
});

it.each([
    { name: 'invalid arguments', args: { questions: [] }, content: success },
    { name: 'an unsuccessful result', args: questionArguments, content: JSON.stringify({ ok: false }) },
    { name: 'a malformed result', args: questionArguments, content: '{' },
])('ignores a question with $name', ({ args, content }) => {
    const message = questionMessage('reply', 'question');
    const blocks = [toolCall('question', ASK_USER_QUESTIONS_TOOL_NAME, args), toolResult('question', content)];
    const { result } = setup({ messages: [{ ...message, blocks }] });

    expect(result.current.byConversation.size).toBe(0);
    expect(result.current.bySpace.size).toBe(0);
});

it('tracks the newest turn by time and clears the request when the user answers', () => {
    const earlier = questionMessage('older-reply', 'old-question');
    const latest = { ...questionMessage('newer-reply', 'new-question'), createdAt: nextTurnAt };
    const { result, store } = setup({ messages: [latest, earlier] });

    expect(result.current.chatAttention).toBe('card:newer-reply:new-question');

    act(() => {
        store.dispatch(
            addMessage({
                id: 'answer',
                conversationId: chat.id,
                parentId: latest.id,
                createdAt: '2026-01-01T09:02:00Z',
                role: Role.User,
            })
        );
    });

    expect(result.current.byConversation.has(chat.id)).toBe(false);
    expect(result.current.bySpace.has(chat.spaceId)).toBe(false);
});

it.each([
    { desktop: true, expected: 'card:schedule-draft' },
    { desktop: false, expected: undefined },
])('recognizes a confirmed schedule draft only on desktop (desktop=$desktop)', ({ desktop, expected }) => {
    const message: Message = {
        id: 'schedule-draft',
        conversationId: chat.id,
        createdAt,
        role: Role.Assistant,
        blocks: [
            toolCall('schedule', CREATE_SCHEDULE_TOOL_NAME, {
                name: 'Morning briefing',
                instructions: 'Summarize today’s events',
                recurrenceRule: { frequency: 'DAILY', hour: 9, minute: 0, timezone: 'UTC' },
                connectors: [],
            }),
            toolResult('schedule'),
        ],
    };
    const { result } = setup({ desktop, messages: [message] });

    expect(result.current.chatAttention).toBe(expected);
    expect(result.current.byConversation.has(chat.id)).toBe(desktop);
});

it('shows the oldest scoped approval before later approvals and falls back to the card', () => {
    const { result, publishApprovals } = setup({ desktop: true, messages: [questionMessage('reply', 'question')] });
    const first = approval('first', chat.id);
    const second = approval('second', chat.id);
    const unscoped = approval('legacy');

    publishApprovals(unscoped, first, second);
    expect(result.current.byConversation).toEqual(new Map([[chat.id, 'approval:first']]));

    publishApprovals(unscoped, second);
    expect(result.current.chatAttention).toBe('approval:second');

    publishApprovals(unscoped);
    expect(result.current.chatAttention).toBe('card:reply:question');
});

it('remembers that a request was seen after navigation and shows a new request for the same chat', () => {
    const { result, navigate, publishApprovals } = setup({ desktop: true });
    const first = approval('first', chat.id);
    publishApprovals(first);
    expect(result.current.chatAttention).toBe('approval:first');

    navigate('/c/chat');
    expect(result.current.chatAttention).toBeUndefined();
    navigate('/');
    expect(result.current.byConversation).toEqual(new Map([[chat.id, undefined]]));
    expect(result.current.bySpace.get(chat.spaceId)).toEqual({ conversationId: chat.id, key: undefined });

    publishApprovals(approval('new-request', chat.id));
    expect(result.current.chatAttention).toBe('approval:new-request');

    publishApprovals();
    expect(result.current.byConversation.size).toBe(0);
    expect(result.current.bySpace.size).toBe(0);
});

it('prefers an unseen request in a shared space and keeps a seen request as a fallback', () => {
    const { result, navigate, publishApprovals } = setup({
        desktop: true,
        conversations: [chat, secondChat],
        path: '/c/chat',
    });
    const first = approval('first', chat.id);
    publishApprovals(first, approval('second', secondChat.id));
    navigate('/');

    expect(result.current.byConversation).toEqual(
        new Map([
            [chat.id, undefined],
            [secondChat.id, 'approval:second'],
        ])
    );
    expect(result.current.bySpace.get(chat.spaceId)).toEqual({
        conversationId: secondChat.id,
        key: 'approval:second',
    });

    publishApprovals(first);
    expect(result.current.bySpace.get(chat.spaceId)).toEqual({ conversationId: chat.id, key: undefined });
});

it('groups an existing approval when its conversation is loaded', async () => {
    const { result, store, publishApprovals } = setup({ desktop: true, conversations: [] });
    publishApprovals(approval('pending', chat.id));

    expect(result.current.chatAttention).toBe('approval:pending');
    expect(result.current.bySpace.size).toBe(0);

    act(() => {
        store.dispatch(addConversation(chat));
    });

    await waitFor(() => {
        expect(result.current.bySpace.get(chat.spaceId)).toEqual({
            conversationId: chat.id,
            key: 'approval:pending',
        });
    });
});

it('builds section keys from the remaining unseen requests in order', () => {
    expect(getGroupAttentionKey([undefined, 'approval:first', undefined, 'card:reply:question'])).toBe(
        'approval:first|card:reply:question'
    );
    expect(getGroupAttentionKey([undefined])).toBeUndefined();
});
