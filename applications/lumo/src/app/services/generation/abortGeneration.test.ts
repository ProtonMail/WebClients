import { updateConversationStatus } from '../../redux/slices/core/conversations';
import { deleteMessage, finishMessage } from '../../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../../redux/store';
import { extraThunkArguments } from '../../redux/thunk';
import { type ConversationId, ConversationStatus, Role } from '../../types';
import { cancelConversationGeneration, isAbortError, throwIfAborted } from './abortGeneration';
import { generationRegistry } from './generationRegistry';
import { discardGenerationRecovery } from './recovery';

jest.mock('./recovery');

describe('abortGeneration', () => {
    const originalApi = extraThunkArguments.api;
    beforeEach(() => {
        extraThunkArguments.api = jest.fn() as unknown as typeof originalApi;
        jest.mocked(discardGenerationRecovery).mockResolvedValue(undefined);
    });
    afterEach(() => {
        generationRegistry.abortAll();
        extraThunkArguments.api = originalApi;
        jest.clearAllMocks();
    });

    it('leaves active cleanup to the finisher and prevents recovery until it settles', () => {
        const controller = generationRegistry.start('conversation');
        const state = { conversations: {} } as LumoState;
        cancelConversationGeneration(jest.fn(), () => state, 'conversation');
        expect(controller.signal.aborted).toBe(true);
        expect(generationRegistry.isInProgress('conversation')).toBe(true);
        expect(() => generationRegistry.start('conversation')).toThrow('Another operation is already in progress');
        expect(discardGenerationRecovery).not.toHaveBeenCalled();
        generationRegistry.finish('conversation');
        expect(generationRegistry.isInProgress('conversation')).toBe(false);
    });

    it('discards a paused checkpoint when no generation is writing it', () => {
        const state = { conversations: {} } as LumoState;
        cancelConversationGeneration(jest.fn(), () => state, 'conversation');
        expect(discardGenerationRecovery).toHaveBeenCalledWith(extraThunkArguments.api, 'conversation');
    });
    it('detects abort errors', () => {
        expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
        expect(isAbortError(new Error('nope'))).toBe(false);
    });

    it('throws when the signal is already aborted', () => {
        const controller = new AbortController();
        controller.abort();
        expect(() => throwIfAborted(controller.signal)).toThrow();
    });

    it('finalizes placeholder assistants and clears generating status', () => {
        const conversationId = 'conv-1' as ConversationId;
        const spaceId = 'space-1';
        const assistantId = 'assistant-1';
        const compactingId = 'compact-1';

        const dispatched: unknown[] = [];
        const dispatch = ((action: unknown) => {
            if (typeof action === 'function') {
                return action(dispatch, () => state);
            }
            dispatched.push(action);
        }) as LumoDispatch;

        const state = {
            conversations: {
                [conversationId]: { id: conversationId, spaceId, status: ConversationStatus.GENERATING },
            },
            messages: {
                [assistantId]: {
                    id: assistantId,
                    conversationId,
                    role: Role.Assistant,
                    placeholder: true,
                    content: 'partial',
                    createdAt: '',
                },
                [compactingId]: {
                    id: compactingId,
                    conversationId,
                    role: Role.Assistant,
                    placeholder: false,
                    createdAt: '',
                    compaction: {
                        status: 'compacting',
                        summary: '',
                        summarizedMessageIds: [],
                        keptMessageIds: [],
                        stats: {},
                        createdAt: '',
                    },
                },
            },
        } as unknown as LumoState;

        cancelConversationGeneration(dispatch, () => state, conversationId, { skipSignalAbort: true });

        expect(dispatched).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: deleteMessage.type, payload: compactingId }),
                expect.objectContaining({
                    type: finishMessage.type,
                    payload: expect.objectContaining({ messageId: assistantId, status: 'succeeded' }),
                }),
                expect.objectContaining({
                    type: updateConversationStatus.type,
                    payload: { id: conversationId, status: ConversationStatus.COMPLETED },
                }),
            ])
        );
    });
});
