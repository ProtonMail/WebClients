import type { Attachment, Message } from '../../../types';
import { Role } from '../../../types';
import type { LumoStreamUsage } from '../../../types-api';
import type { LumoState } from '../../store';
import messagesReducer, {
    type MessageMap,
    recordMessageUsage,
    setMessageModelID,
    setMessageUsage,
} from './messages';

const assistantMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'm1',
    createdAt: '2026-01-01T00:00:00.000Z',
    role: Role.Assistant,
    parentId: 'u1',
    conversationId: 'c1',
    placeholder: false,
    status: 'succeeded',
    content: 'answer',
    ...overrides,
});

describe('setMessageUsage reducer', () => {
    it('stores usage on the target message', () => {
        const state: MessageMap = { m1: assistantMessage() };
        const next = messagesReducer(
            state,
            setMessageUsage({ messageId: 'm1', usage: { promptTokens: 696, totalTokens: 703 } })
        );
        expect(next.m1.usage).toEqual({ promptTokens: 696, totalTokens: 703 });
    });

    it('merges with previously stored usage instead of clobbering it', () => {
        const state: MessageMap = { m1: assistantMessage({ usage: { promptTokens: 696 } }) };
        const next = messagesReducer(
            state,
            setMessageUsage({ messageId: 'm1', usage: { completionTokens: 7, ctxFilesTokenEstimate: 512 } })
        );
        expect(next.m1.usage).toEqual({ promptTokens: 696, completionTokens: 7, ctxFilesTokenEstimate: 512 });
    });

    it('is a no-op when the message is missing', () => {
        const state: MessageMap = {};
        const next = messagesReducer(state, setMessageUsage({ messageId: 'ghost', usage: { promptTokens: 1 } }));
        expect(next.ghost).toBeUndefined();
    });
});

describe('recordMessageUsage thunk', () => {
    const runThunk = (usage: LumoStreamUsage | undefined, state: Partial<LumoState>) => {
        const dispatched: any[] = [];
        const dispatch = (action: any) => {
            dispatched.push(action);
            return action;
        };
        const getState = () => state as LumoState;
        recordMessageUsage('m1', usage)(dispatch as any, getState as any);
        return dispatched;
    };

    it('does nothing when usage is undefined', () => {
        const dispatched = runThunk(undefined, { messages: { m1: assistantMessage() }, attachments: {} });
        expect(dispatched).toHaveLength(0);
    });

    it('does nothing when usage carries no token counts or model id', () => {
        const dispatched = runThunk(
            { remaining_limits: { lite: 5 } },
            { messages: { m1: assistantMessage() }, attachments: {} }
        );
        expect(dispatched).toHaveLength(0);
    });

    it('stores model id even when usage carries no token counts', () => {
        const dispatched = runThunk(
            { model: '3b6be88a', remaining_limits: { lite: 5 } },
            { messages: { m1: assistantMessage() }, attachments: {} }
        );
        expect(dispatched).toEqual([setMessageModelID({ messageId: 'm1', modelID: '3b6be88a' })]);
    });

    it('maps backend token fields and omits absent ones', () => {
        const dispatched = runThunk(
            { prompt_tokens: 696, completion_tokens: 7, total_tokens: 703 },
            { messages: { m1: assistantMessage() }, attachments: {} }
        );
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0]).toEqual(
            setMessageUsage({
                messageId: 'm1',
                usage: { promptTokens: 696, completionTokens: 7, totalTokens: 703, tokenEstimateVersion: 1 },
            })
        );
    });

    it('stores model id alongside token counts', () => {
        const dispatched = runThunk(
            { prompt_tokens: 696, completion_tokens: 7, total_tokens: 703, model: '3b6be88a' },
            { messages: { m1: assistantMessage() }, attachments: {} }
        );
        expect(dispatched).toEqual([
            setMessageModelID({ messageId: 'm1', modelID: '3b6be88a' }),
            setMessageUsage({
                messageId: 'm1',
                usage: { promptTokens: 696, completionTokens: 7, totalTokens: 703, tokenEstimateVersion: 1 },
            }),
        ]);
    });

    it('computes ctxFilesTokenEstimate from the message contextFiles using cached token counts', () => {
        const attachments: Record<string, Attachment> = {
            a1: { id: 'a1', filename: 'a.txt', tokenCount: 300 } as Attachment,
            a2: { id: 'a2', filename: 'b.txt', tokenCount: 200 } as Attachment,
        };
        const dispatched = runThunk(
            { prompt_tokens: 1000 },
            {
                messages: { m1: assistantMessage({ contextFiles: ['a1', 'a2'] }) },
                attachments,
            }
        );
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0].payload.usage).toEqual({
            promptTokens: 1000,
            ctxFilesTokenEstimate: 500,
            tokenEstimateVersion: 1,
        });
    });

    it('ignores contextFiles that are no longer present in the attachment map', () => {
        const attachments: Record<string, Attachment> = {
            a1: { id: 'a1', filename: 'a.txt', tokenCount: 300 } as Attachment,
        };
        const dispatched = runThunk(
            { prompt_tokens: 1000 },
            {
                messages: { m1: assistantMessage({ contextFiles: ['a1', 'deleted'] }) },
                attachments,
            }
        );
        expect(dispatched[0].payload.usage).toEqual({
            promptTokens: 1000,
            ctxFilesTokenEstimate: 300,
            tokenEstimateVersion: 1,
        });
    });
});

describe('setMessageModelID reducer', () => {
    it('stores model id on the target message', () => {
        const state: MessageMap = { m1: assistantMessage() };
        const next = messagesReducer(state, setMessageModelID({ messageId: 'm1', modelID: '3b6be88a' }));
        expect(next.m1.modelID).toBe('3b6be88a');
    });
});
