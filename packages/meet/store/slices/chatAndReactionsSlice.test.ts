import { describe, expect, it } from 'vitest';

import type { MeetChatMessage } from '../../types/types';
import type { MeetState } from '../rootReducer';
import type { MeetingChatAndReactionsState } from './chatAndReactionsSlice';
import {
    addChatMessageReaction,
    addChatMessages,
    chatAndReactionsReducer,
    markChatMessagesAsSeen,
    removeChatMessageReaction,
    selectChatMessageReactions,
    selectChatMessages,
    selectChatReactionId,
    selectChatThreadExpanded,
    selectChatThreadReplyDraft,
    selectDraftMessage,
} from './chatAndReactionsSlice';

const reducer = chatAndReactionsReducer.meetingChatAndReactions;

const getInitialState = () => reducer(undefined, { type: '@@INIT' });

const IDENTITY_ALICE = 'alice';
const IDENTITY_BOB = 'bob';
const IDENTITY_CAROL = 'carol';

const EMOJI_THUMBS_UP = '👍';
const EMOJI_PARTY = '🎉';

const createMessage = (overrides: Partial<MeetChatMessage> = {}): MeetChatMessage => ({
    id: 'message-1',
    identity: IDENTITY_ALICE,
    message: 'Hello',
    timestamp: 1_000,
    ...overrides,
});

const createMockState = (overrides: Partial<MeetingChatAndReactionsState> = {}): MeetState =>
    ({
        meetingChatAndReactions: {
            ...getInitialState(),
            ...overrides,
        },
    }) as unknown as MeetState;

describe('chatAndReactionsSlice - new chat handling', () => {
    describe('normal chat message', () => {
        it('should add a chat message', () => {
            const message = createMessage();

            const state = reducer(getInitialState(), addChatMessages([message]));

            expect(state.chatMessages).toEqual([message]);
        });
    });

    describe('reaction', () => {
        it('should add a reaction to a message and index the reaction event', () => {
            const message = createMessage();
            const withMessage = reducer(getInitialState(), addChatMessages([message]));

            const state = reducer(
                withMessage,
                addChatMessageReaction({
                    reactionId: 'reaction-1',
                    messageId: 'message-1',
                    emoji: EMOJI_THUMBS_UP,
                    identity: IDENTITY_BOB,
                })
            );

            expect(state.chatMessages[0].reactions).toEqual({ [EMOJI_THUMBS_UP]: [IDENTITY_BOB] });
            expect(state.reactionEventIndex['reaction-1']).toEqual({
                messageId: 'message-1',
                emoji: EMOJI_THUMBS_UP,
                identity: IDENTITY_BOB,
            });
        });
    });

    describe('unreaction', () => {
        it('should remove a reaction and clear the reaction event index', () => {
            const message = createMessage();
            const withMessage = reducer(getInitialState(), addChatMessages([message]));
            const withReaction = reducer(
                withMessage,
                addChatMessageReaction({
                    reactionId: 'reaction-1',
                    messageId: 'message-1',
                    emoji: EMOJI_THUMBS_UP,
                    identity: IDENTITY_BOB,
                })
            );

            const state = reducer(
                withReaction,
                removeChatMessageReaction({ replacesId: 'reaction-1', identity: IDENTITY_BOB })
            );

            expect(state.chatMessages[0].reactions).toEqual({});
            expect(state.reactionEventIndex['reaction-1']).toBeUndefined();
        });
    });

    describe('reply to a normal chat message', () => {
        it('should add a reply that references the original message as its topic', () => {
            const original = createMessage({ id: 'message-1', identity: IDENTITY_ALICE });
            const withOriginal = reducer(getInitialState(), addChatMessages([original]));

            const reply = createMessage({
                id: 'reply-1',
                identity: IDENTITY_BOB,
                message: 'Replying to you',
                timestamp: 2_000,
                inReplyToId: 'message-1',
                topicId: 'message-1',
            });

            const state = reducer(withOriginal, addChatMessages([reply]));

            expect(state.chatMessages).toEqual([original, reply]);
        });
    });

    describe('thread message', () => {
        it('should add a thread reply message', () => {
            const root = createMessage({ id: 'root-1', topicId: 'root-1' });
            const withRoot = reducer(getInitialState(), addChatMessages([root]));

            const reply = createMessage({
                id: 'reply-1',
                identity: IDENTITY_BOB,
                message: 'A reply',
                timestamp: 2_000,
                topicId: 'root-1',
                inReplyToId: 'root-1',
            });

            const state = reducer(withRoot, addChatMessages([reply]));

            expect(state.chatMessages).toEqual([root, reply]);
        });
    });

    describe('thread message reaction', () => {
        it('should add a reaction to a thread reply message', () => {
            const root = createMessage({ id: 'root-1', topicId: 'root-1' });
            const reply = createMessage({
                id: 'reply-1',
                identity: IDENTITY_BOB,
                message: 'A reply',
                timestamp: 2_000,
                topicId: 'root-1',
                inReplyToId: 'root-1',
            });
            const withMessages = reducer(getInitialState(), addChatMessages([root, reply]));

            const state = reducer(
                withMessages,
                addChatMessageReaction({
                    reactionId: 'reaction-1',
                    messageId: 'reply-1',
                    emoji: EMOJI_PARTY,
                    identity: IDENTITY_CAROL,
                })
            );

            const replyMessage = state.chatMessages.find((m) => m.id === 'reply-1');
            expect(replyMessage?.reactions).toEqual({ [EMOJI_PARTY]: [IDENTITY_CAROL] });
            expect(state.reactionEventIndex['reaction-1']).toEqual({
                messageId: 'reply-1',
                emoji: EMOJI_PARTY,
                identity: IDENTITY_CAROL,
            });
        });
    });

    describe('thread message unreaction', () => {
        it('should remove a reaction from a thread reply message', () => {
            const root = createMessage({ id: 'root-1', topicId: 'root-1' });
            const reply = createMessage({
                id: 'reply-1',
                identity: IDENTITY_BOB,
                message: 'A reply',
                timestamp: 2_000,
                topicId: 'root-1',
                inReplyToId: 'root-1',
            });
            const withMessages = reducer(getInitialState(), addChatMessages([root, reply]));
            const withReaction = reducer(
                withMessages,
                addChatMessageReaction({
                    reactionId: 'reaction-1',
                    messageId: 'reply-1',
                    emoji: EMOJI_PARTY,
                    identity: IDENTITY_CAROL,
                })
            );

            const state = reducer(
                withReaction,
                removeChatMessageReaction({ replacesId: 'reaction-1', identity: IDENTITY_CAROL })
            );

            const replyMessage = state.chatMessages.find((m) => m.id === 'reply-1');
            expect(replyMessage?.reactions).toEqual({});
            expect(state.reactionEventIndex['reaction-1']).toBeUndefined();
        });
    });

    describe('markChatMessagesAsSeen', () => {
        it('should mark root messages as seen but leave replies of a collapsed thread unseen', () => {
            const rootWithoutTopic = createMessage({ id: 'message-1', seen: false });
            const collapsedRoot = createMessage({ id: 'root-1', topicId: 'root-1', expanded: false, seen: false });
            const collapsedReply = createMessage({
                id: 'reply-1',
                identity: IDENTITY_BOB,
                message: 'A reply',
                timestamp: 2_000,
                topicId: 'root-1',
                inReplyToId: 'root-1',
                seen: false,
            });
            const withMessages = reducer(
                getInitialState(),
                addChatMessages([rootWithoutTopic, collapsedRoot, collapsedReply])
            );

            const state = reducer(withMessages, markChatMessagesAsSeen());

            expect(state.chatMessages.find((m) => m.id === 'message-1')?.seen).toBe(true);
            expect(state.chatMessages.find((m) => m.id === 'root-1')?.seen).toBe(true);
            expect(state.chatMessages.find((m) => m.id === 'reply-1')?.seen).toBe(false);
        });

        it('should mark replies of an expanded thread as seen', () => {
            const expandedRoot = createMessage({ id: 'root-1', topicId: 'root-1', expanded: true, seen: false });
            const reply = createMessage({
                id: 'reply-1',
                identity: IDENTITY_BOB,
                message: 'A reply',
                timestamp: 2_000,
                topicId: 'root-1',
                inReplyToId: 'root-1',
                seen: false,
            });
            const withMessages = reducer(getInitialState(), addChatMessages([expandedRoot, reply]));

            const state = reducer(withMessages, markChatMessagesAsSeen());

            expect(state.chatMessages.find((m) => m.id === 'root-1')?.seen).toBe(true);
            expect(state.chatMessages.find((m) => m.id === 'reply-1')?.seen).toBe(true);
        });
    });

    describe('selectors', () => {
        describe('selectDraftMessage', () => {
            it('should return the draft message', () => {
                const state = createMockState({ draftMessage: 'work in progress' });

                expect(selectDraftMessage(state)).toBe('work in progress');
            });
        });

        describe('selectChatMessages', () => {
            it('should return the chat messages', () => {
                const messages = [createMessage(), createMessage({ id: 'message-2' })];
                const state = createMockState({ chatMessages: messages });

                expect(selectChatMessages(state)).toEqual(messages);
            });
        });

        describe('selectChatMessageReactions', () => {
            it('should return the reactions for a message', () => {
                const message = createMessage({ reactions: { [EMOJI_THUMBS_UP]: [IDENTITY_ALICE, IDENTITY_BOB] } });
                const state = createMockState({ chatMessages: [message] });

                expect(selectChatMessageReactions(state, 'message-1')).toEqual({
                    [EMOJI_THUMBS_UP]: [IDENTITY_ALICE, IDENTITY_BOB],
                });
            });

            it('should return an empty object for a message without reactions', () => {
                const state = createMockState({ chatMessages: [createMessage()] });

                expect(selectChatMessageReactions(state, 'message-1')).toEqual({});
            });
        });

        describe('selectChatReactionId', () => {
            it('should return the reaction id for a matching message/emoji/identity', () => {
                const state = createMockState({
                    reactionEventIndex: {
                        'reaction-1': { messageId: 'message-1', emoji: EMOJI_THUMBS_UP, identity: IDENTITY_BOB },
                    },
                });

                expect(selectChatReactionId(state, 'message-1', EMOJI_THUMBS_UP, IDENTITY_BOB)).toBe('reaction-1');
            });

            it('should return undefined when there is no matching reaction', () => {
                const state = createMockState({
                    reactionEventIndex: {
                        'reaction-1': { messageId: 'message-1', emoji: EMOJI_THUMBS_UP, identity: IDENTITY_BOB },
                    },
                });

                expect(selectChatReactionId(state, 'message-1', EMOJI_THUMBS_UP, IDENTITY_ALICE)).toBeUndefined();
            });
        });

        describe('selectChatThreadExpanded', () => {
            it('should return the expanded state of a thread root message', () => {
                const root = createMessage({ id: 'root-1', expanded: true });
                const state = createMockState({ chatMessages: [root] });

                expect(selectChatThreadExpanded(state, 'root-1')).toBe(true);
            });
        });

        describe('selectChatThreadReplyDraft', () => {
            it('should return the reply draft of a thread root message', () => {
                const root = createMessage({ id: 'root-1', replyDraft: 'my draft reply' });
                const state = createMockState({ chatMessages: [root] });

                expect(selectChatThreadReplyDraft(state, 'root-1')).toBe('my draft reply');
            });

            it('should return an empty string when the root message has no reply draft', () => {
                const root = createMessage({ id: 'root-1' });
                const state = createMockState({ chatMessages: [root] });

                expect(selectChatThreadReplyDraft(state, 'root-1')).toBe('');
            });
        });
    });
});
