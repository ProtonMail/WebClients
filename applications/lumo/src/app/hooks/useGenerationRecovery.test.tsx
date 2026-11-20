import { act, renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import { quickChat } from '@proton/lumo-api-client/assistant';
import { newRecoveryState } from '@proton/lumo-api-client/core/recovery';

import { resolveClientToolExecutor } from '../components/Conversation/compactionFlow';
import { sendMessageWithRedux } from '../lib/lumoApiClientRedux';
import { useLumoSelector, useLumoStore } from '../redux/hooks';
import { updateConversationStatus } from '../redux/slices/core/conversations';
import { addMessage, pushMessageRequest } from '../redux/slices/core/messages';
import { extraThunkArguments } from '../redux/thunk';
import { generationRegistry } from '../services/generation/generationRegistry';
import type { RecoveryRecord } from '../services/generation/recovery';
import {
    cancelGenerationJobs,
    finalizeGenerationRecovery,
    generationRecoveryStore,
    logGenerationRecoveryError,
} from '../services/generation/recovery';
import { ConversationStatus, Role, SpaceType } from '../types';
import { useGenerationRecovery } from './useGenerationRecovery';
import { useLumoFlags } from './useLumoFlags';

vi.mock('@proton/app-context/useApi');
vi.mock('@proton/lumo-api-client/assistant', () => ({ quickChat: vi.fn() }));
vi.mock('../redux/hooks');
vi.mock('./useLumoFlags');
vi.mock('../services/generation/recovery');
vi.mock('../components/Conversation/compactionFlow', () => ({ resolveClientToolExecutor: vi.fn() }));
vi.mock('../lib/lumoApiClientRedux', () => ({ sendMessageWithRedux: vi.fn() }));

it('does not scan or replay checkpoints when the feature flag is disabled', () => {
    vi.mocked(useApi).mockReturnValue(vi.fn());
    vi.mocked(useLumoStore).mockReturnValue({} as ReturnType<typeof useLumoStore>);
    vi.mocked(useLumoSelector).mockReturnValue({});
    vi.mocked(useLumoFlags).mockReturnValue({ resumableGeneration: false } as ReturnType<typeof useLumoFlags>);
    const { result } = renderHook(() => useGenerationRecovery('chat', true));
    expect(generationRecoveryStore).not.toHaveBeenCalled();
    expect(result.current.hydrated).toBe(true);
    expect(result.current.modal).toBeNull();
});

it('scans checkpoints once recovery is enabled', async () => {
    const database = { expiredIds: vi.fn(async () => []), ids: vi.fn(async () => []) };
    vi.mocked(useApi).mockReturnValue(vi.fn());
    vi.mocked(useLumoStore).mockReturnValue({} as ReturnType<typeof useLumoStore>);
    vi.mocked(useLumoSelector).mockReturnValue({});
    vi.mocked(useLumoFlags).mockReturnValue({ resumableGeneration: true } as ReturnType<typeof useLumoFlags>);
    vi.mocked(generationRecoveryStore).mockReturnValue(
        database as unknown as ReturnType<typeof generationRecoveryStore>
    );
    const { result } = renderHook(() => useGenerationRecovery('chat', true));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(database.expiredIds).toHaveBeenCalledTimes(1);
    expect(database.ids).toHaveBeenCalledTimes(1);
});

describe('returning to a running generation', () => {
    beforeEach(() => {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
        vi.mocked(useApi).mockReturnValue(vi.fn());
        vi.mocked(useLumoStore).mockReturnValue({} as ReturnType<typeof useLumoStore>);
        vi.mocked(useLumoSelector).mockReturnValue({});
        vi.mocked(useLumoFlags).mockReturnValue({ resumableGeneration: true } as ReturnType<typeof useLumoFlags>);
        vi.mocked(resolveClientToolExecutor).mockReturnValue({});
    });

    afterEach(() => {
        generationRegistry.abortAll();
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it.each(['visibility', 'network'])('keeps a healthy stream through a %s transition', async (transition) => {
        const database = {
            get: vi.fn(async () => ({ checkpoint: { phase: 'streaming' } })),
            expiredIds: vi.fn(async () => []),
            ids: vi.fn(async () => []),
        };
        vi.mocked(generationRecoveryStore).mockReturnValue(
            database as unknown as ReturnType<typeof generationRecoveryStore>
        );
        const controller = generationRegistry.start('chat');
        renderHook(() => useGenerationRecovery('chat', true));

        if (transition === 'visibility') {
            await act(async () => {
                vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
                document.dispatchEvent(new Event('visibilitychange'));
            });
            await act(async () => {
                vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
                document.dispatchEvent(new Event('visibilitychange'));
            });
        } else {
            await act(async () => {
                vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
                window.dispatchEvent(new Event('offline'));
            });
            await act(async () => {
                vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
                window.dispatchEvent(new Event('online'));
            });
        }

        expect(controller.signal.aborted).toBe(false);
        expect(generationRegistry.isInProgress('chat')).toBe(true);
        expect(database.get).not.toHaveBeenCalled();
        expect(sendMessageWithRedux).not.toHaveBeenCalled();
    });

    const failures = [
        'none',
        'read',
        'restore',
        'retrieval',
        'ghost',
        'completed-tool',
        'pending-title',
        'ownership',
        'busy',
    ];
    it.each(failures)('replays a checkpoint after a %s failure', async (failure) => {
        const timestamp = '2026-10-30T00:00:00Z';
        const record: RecoveryRecord = {
            checkpoint: newRecoveryState([{ role: Role.User, content: 'Hello' }], 'message'),
            options: {},
            space: {
                id: 'space',
                spaceType: SpaceType.Default,
                spaceKey: '',
                createdAt: timestamp,
                updatedAt: timestamp,
            },
            conversation: {
                id: 'chat',
                spaceId: 'space',
                title: 'Chat',
                createdAt: timestamp,
                updatedAt: timestamp,
            },
            message: {
                id: 'answer',
                conversationId: 'chat',
                role: Role.Assistant,
                createdAt: timestamp,
                placeholder: true,
            },
            ancestors: [],
            attachments: [],
        };
        record.conversation.ghost = failure === 'ghost';
        if (failure === 'pending-title') {
            record.checkpoint.phase = 'completed';
            record.checkpoint.title = newRecoveryState([{ role: Role.User, content: 'Hello' }], 'title');
            record.message.content = 'Completed answer';
        }
        if (failure === 'completed-tool') {
            record.checkpoint.phase = 'completed';
            record.message.content = '';
            record.message.toolCall = '{"id":"question","name":"ask_user_questions","arguments":{}}';
            record.message.toolResult = '{"ok":true}';
        }
        const error = new Error('Unreadable checkpoint');
        if (failure === 'retrieval') {
            record.config = { enableU2LEncryption: false };
            vi.mocked(quickChat).mockResolvedValue('The recovered file budget is 42.');
            record.retrieval = {
                allowWideScopes: false,
                chatSearch: 'none',
                searchOtherSpaces: false,
                hasLumoPlus: false,
                chatAttachments: [],
                visibleMessageIds: ['question'],
                excludedAttachmentIds: ['excluded'],
                excludedDocumentIds: ['excluded-document'],
                execution: { calls: 3, reads: 1 },
                analyzeEnabled: true,
            };
        }
        const executor = { canExecute: vi.fn(), execute: vi.fn() };
        vi.mocked(resolveClientToolExecutor).mockReturnValue({ executor });
        const database = {
            get: vi.fn(async (id: string) => {
                if (id === 'broken' && failure === 'read') {
                    throw error;
                }
                return id === 'broken' ? { ...record, conversation: { ...record.conversation, id: 'broken' } } : record;
            }),
            remove: vi.fn(),
            expiredIds: vi.fn(async () => []),
            ids: vi.fn(async () => (failure === 'read' || failure === 'restore' ? ['broken', 'chat'] : ['chat'])),
        };
        const store = {
            dispatch: vi.fn(),
            getState: () => ({
                spaces: { space: record.space },
                conversations: { chat: record.conversation },
                messages: {},
                skills: { skills: {} },
                lumoUserSettings: {},
                contextFilters: { filters: [] },
                credentials: { masterKeyState: { status: 'ready' } },
                idmap: { local2remote: { attachment: {} } },
            }),
        };
        vi.mocked(useLumoStore).mockReturnValue(store as unknown as ReturnType<typeof useLumoStore>);
        vi.mocked(generationRecoveryStore).mockReturnValue(
            database as unknown as ReturnType<typeof generationRecoveryStore>
        );
        const originalDatabase = extraThunkArguments.dbApi;
        if (failure === 'restore') {
            vi.mocked(useLumoSelector).mockReturnValue({});
            extraThunkArguments.dbApi = {
                getConversationById: vi.fn(async (id: string) => {
                    if (id === 'broken') {
                        throw error;
                    }
                }),
            } as unknown as typeof originalDatabase;
        }
        if (failure === 'busy') {
            vi.spyOn(generationRegistry, 'startExclusive').mockRejectedValueOnce(
                new Error('Another operation is already in progress')
            );
        }
        const lockReady = Promise.withResolvers<void>();
        if (failure === 'ownership') {
            vi.spyOn(generationRegistry, 'startExclusive').mockImplementationOnce(async (id) => {
                await lockReady.promise;
                return generationRegistry.start(id);
            });
        }
        generationRegistry.start('chat');
        renderHook(() => useGenerationRecovery('chat', true));
        expect(sendMessageWithRedux).not.toHaveBeenCalled();

        generationRegistry.finish('chat');
        try {
            await act(async () => {
                window.dispatchEvent(new Event('online'));
            });
        } finally {
            extraThunkArguments.dbApi = originalDatabase;
        }
        if (failure === 'busy') {
            expect(store.dispatch).toHaveBeenCalledWith(addMessage(record.message));
            expect(store.dispatch).toHaveBeenCalledWith(
                updateConversationStatus({ id: 'chat', status: ConversationStatus.GENERATING })
            );
            expect(database.remove).not.toHaveBeenCalled();
            expect(sendMessageWithRedux).not.toHaveBeenCalled();
            expect(resolveClientToolExecutor).not.toHaveBeenCalled();
            return;
        }
        if (failure === 'ownership') {
            expect(database.get).not.toHaveBeenCalled();
            record.checkpoint.phase = 'completed';
            record.message.content = 'Completed by the previous owner';
            await act(async () => lockReady.resolve());
            await waitFor(() =>
                expect(store.dispatch).toHaveBeenCalledWith(
                    addMessage({
                        ...record.message,
                        placeholder: false,
                        status: 'succeeded',
                    })
                )
            );
            expect(sendMessageWithRedux).not.toHaveBeenCalled();
            expect(resolveClientToolExecutor).not.toHaveBeenCalled();
            return;
        }
        if (failure === 'read' || failure === 'restore') {
            expect(logGenerationRecoveryError).toHaveBeenCalledWith('checkpoint restore', error);
            expect(database.remove).not.toHaveBeenCalled();
        }

        if (failure === 'completed-tool') {
            expect(store.dispatch).toHaveBeenCalledWith(
                addMessage({
                    ...record.message,
                    placeholder: false,
                    status: 'succeeded',
                })
            );
            expect(finalizeGenerationRecovery).toHaveBeenCalledWith('chat', store.getState(), expect.any(Function));
            expect(store.dispatch).toHaveBeenCalledWith(pushMessageRequest({ id: 'answer' }));
            expect(sendMessageWithRedux).not.toHaveBeenCalled();
            expect(resolveClientToolExecutor).not.toHaveBeenCalled();
            return;
        }
        if (failure === 'ghost') {
            expect(database.remove).toHaveBeenCalledWith('chat', record.checkpoint.jobId);
            expect(cancelGenerationJobs).toHaveBeenCalledWith(expect.any(Function), record.checkpoint);
            expect(sendMessageWithRedux).not.toHaveBeenCalled();
            expect(store.dispatch).not.toHaveBeenCalled();
            return;
        }
        expect(sendMessageWithRedux).toHaveBeenCalledTimes(1);
        expect(sendMessageWithRedux).toHaveBeenCalledWith(
            expect.any(Function),
            record.checkpoint.turns,
            expect.objectContaining({
                recoveryRecord: record,
                resume: record.checkpoint,
                messageId: 'answer',
                conversationId: 'chat',
                clientToolExecutor: executor,
            })
        );
        const lookupPool = vi.mocked(resolveClientToolExecutor).mock.calls[0][2];
        expect(lookupPool()).toEqual([]);
        if (record.retrieval) {
            const [options] = vi.mocked(resolveClientToolExecutor).mock.calls[0];
            expect(options.retrievalExecutionState).toEqual({ calls: 3, reads: 1 });
            expect(options.retrievalTools?.getVisibleMessageIds()).toEqual(new Set(['question']));
            expect(options.retrievalTools?.exclusions.attachmentIds).toEqual(new Set(['excluded']));
            expect(await options.retrievalTools?.analyze?.('Find the budget')).toBe('The recovered file budget is 42.');
            expect(quickChat).toHaveBeenCalledWith(expect.any(Function), 'Find the budget', {
                signal: options.retrievalTools?.signal,
                modelTier: 'lumo-lite',
                config: { enableU2LEncryption: false },
            });
            expect(options.retrievalTools?.signal).toBeInstanceOf(AbortSignal);
            expect(sendMessageWithRedux).toHaveBeenCalledWith(
                expect.any(Function),
                record.checkpoint.turns,
                expect.objectContaining({ retrievalTools: options.retrievalTools })
            );
        }
    });
});

const originalAccountDatabase = extraThunkArguments.dbApi;
beforeEach(() => {
    extraThunkArguments.dbApi = {
        getConversationById: async () => undefined,
    } as unknown as typeof originalAccountDatabase;
    vi.spyOn(generationRegistry, 'canRecover').mockReturnValue(true);
});
afterEach(() => {
    extraThunkArguments.dbApi = originalAccountDatabase;
    vi.restoreAllMocks();
});

it('scans the guest memory store without an account master key', async () => {
    Object.assign(extraThunkArguments, { dbApi: undefined });
    vi.mocked(useApi).mockReturnValue(vi.fn());
    vi.mocked(useLumoStore).mockReturnValue({} as ReturnType<typeof useLumoStore>);
    vi.mocked(useLumoSelector).mockReturnValue(undefined);
    vi.mocked(useLumoFlags).mockReturnValue({ resumableGeneration: true } as ReturnType<typeof useLumoFlags>);
    const memory = { expiredIds: vi.fn(async () => []), ids: vi.fn(async () => []) };
    vi.mocked(generationRecoveryStore).mockReturnValue(memory as unknown as ReturnType<typeof generationRecoveryStore>);
    const { result } = renderHook(() => useGenerationRecovery('guest-chat', true));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.modal).toBeNull();
    expect(memory.ids).toHaveBeenCalledTimes(1);
});
