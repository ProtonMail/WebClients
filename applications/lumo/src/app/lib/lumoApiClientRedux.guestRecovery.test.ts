import type { UnknownAction } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { TransformStream } from 'stream/web';

import { useApi } from '@proton/app-context/useApi';
import { encryptString } from '@proton/lumo-api-client/core/encryption';
import { RequestEncryptionParams } from '@proton/lumo-api-client/core/encryptionParams';
import { GenerationInterruptedError } from '@proton/lumo-api-client/core/recovery';
import type { ChatCompletionsRequest } from '@proton/lumo-api-client/types-api';
import type { FetchConfig } from '@proton/shared/lib/fetch/interface';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { base64ToSpaceKey } from '../crypto';
import { useGenerationRecovery } from '../hooks/useGenerationRecovery';
import { useLumoFlags } from '../hooks/useLumoFlags';
import { useLumoSelector, useLumoStore } from '../redux/hooks';
import conversationsReducer from '../redux/slices/core/conversations';
import messagesReducer from '../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../redux/store';
import { extraThunkArguments } from '../redux/thunk';
import { cancelConversationGeneration } from '../services/generation/abortGeneration';
import { generationRegistry } from '../services/generation/generationRegistry';
import { generationRecoveryStore, getGenerationRecovery } from '../services/generation/recovery';
import type { RecoveryRecord } from '../services/generation/recovery';
import { ConversationStatus, Role, SpaceType } from '../types';
import { sendMessageWithRedux } from './lumoApiClientRedux';

jest.mock('@proton/app-context/useApi');
jest.mock('../hooks/useLumoFlags');
jest.mock('../redux/hooks');

Object.assign(globalThis, { TransformStream });

async function encryptedResponse(record: RecoveryRecord, completed: boolean): Promise<ReadableStream> {
    const content = await encryptString(
        completed ? 'Private recovered answer' : 'Private partial answer',
        await base64ToSpaceKey(record.requestKey!, true),
        RequestEncryptionParams.getResponseAd(record.requestId!)
    );
    const payload = JSON.stringify({ choices: [{ index: 0, delta: { content, encrypted: true } }] });
    return new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n${completed ? 'data: [DONE]\n\n' : ''}`));
            controller.close();
        },
    });
}

it.each(['headers', 'stream', 'stop'] as const)(
    'recovers an encrypted guest generation after %s interruption without writing keys or content to browser storage',
    async (interruption) => {
        const originalDb = extraThunkArguments.dbApi;
        const originalApi = extraThunkArguments.api;
        Object.assign(extraThunkArguments, { dbApi: undefined });
        const id = `guest-${interruption}`;
        const now = new Date().toISOString();
        const state = {
            messages: {
                answer: { id: 'answer', conversationId: id, role: Role.Assistant, createdAt: now, placeholder: true },
            },
            conversations: {
                [id]: {
                    id,
                    spaceId: 'space',
                    title: 'Guest chat',
                    createdAt: now,
                    updatedAt: now,
                    status: ConversationStatus.GENERATING,
                },
            },
            spaces: {
                space: { id: 'space', spaceType: SpaceType.Default, spaceKey: '', createdAt: now, updatedAt: now },
            },
            attachments: {},
            skills: { skills: {} },
            credentials: { masterKeyState: { status: 'loading' } },
        } as unknown as LumoState;
        const dispatch = ((action: UnknownAction | ReturnType<typeof sendMessageWithRedux>) => {
            if (typeof action === 'function') {
                return action(dispatch, () => state);
            }
            state.messages = messagesReducer(state.messages, action);
            state.conversations = conversationsReducer(state.conversations, action);
            return action;
        }) as LumoDispatch;
        const api = jest.fn<Promise<ReadableStream>, [FetchConfig]>(async (request) => {
            if (request.method === 'delete') {
                return new ReadableStream({ start: (controller) => controller.close() });
            }
            const record = await getGenerationRecovery(id);
            expect(record).toMatchObject({ requestKey: expect.any(String), requestId: expect.any(String) });
            if (request.method === 'post' && interruption !== 'stream') {
                throw new TypeError('Network disconnected');
            }
            return encryptedResponse(record!, request.method === 'get');
        });
        extraThunkArguments.api = api as unknown as typeof originalApi;
        jest.spyOn(RequestEncryptionParams.prototype, 'encryptRequestKey').mockResolvedValue('worker-wrapped-key');
        jest.spyOn(generationRegistry, 'canRecover').mockReturnValue(false);
        jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
        const open = jest.spyOn(indexedDB, 'open');
        const write = jest.spyOn(Storage.prototype, 'setItem');
        let unmount: (() => void) | undefined;
        try {
            const controller = await generationRegistry.startExclusive(id);
            await expect(
                dispatch(
                    sendMessageWithRedux(api as unknown as Api, [{ role: Role.User, content: 'Private question' }], {
                        config: { enableU2LEncryption: true, enableSmoothing: false },
                        messageId: 'answer',
                        conversationId: id,
                        spaceId: 'space',
                        enableGenerationRecovery: true,
                        signal: controller.signal,
                    })
                ).finally(() => generationRegistry.finish(id, controller))
            ).rejects.toBeInstanceOf(GenerationInterruptedError);
            const snapshot = (await getGenerationRecovery(id))!;
            expect(snapshot).toMatchObject({
                checkpoint: { phase: 'streaming' },
                requestKey: expect.any(String),
                requestId: (api.mock.calls[0][0].data as ChatCompletionsRequest).lumo!.request_id,
            });
            expect((api.mock.calls[0][0].data as ChatCompletionsRequest).lumo).toMatchObject({
                resumable: true,
                job_id: snapshot.checkpoint.jobId,
            });
            if (interruption === 'stream') {
                expect(state.messages.answer.content).toBe('Private partial answer');
            }
            if (interruption === 'stop') {
                cancelConversationGeneration(dispatch, () => state, id);
            } else {
                jest.mocked(useApi).mockReturnValue(api as unknown as Api);
                jest.mocked(useLumoStore).mockReturnValue({ dispatch, getState: () => state } as ReturnType<
                    typeof useLumoStore
                >);
                jest.mocked(useLumoSelector).mockReturnValue(undefined);
                jest.mocked(useLumoFlags).mockReturnValue({ resumableGeneration: true } as ReturnType<
                    typeof useLumoFlags
                >);
                ({ unmount } = renderHook(() => useGenerationRecovery(id, true)));
                await waitFor(() =>
                    expect(state.messages.answer).toMatchObject({
                        content: 'Private recovered answer',
                        status: 'succeeded',
                        placeholder: false,
                    })
                );
                expect(api).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method: 'get',
                        url: `ai/v1/jobs/${snapshot.checkpoint.jobId}/resume`,
                        headers: { 'x-lumo-resume-token': snapshot.checkpoint.token },
                    })
                );
            }
            await waitFor(() =>
                expect(api).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method: 'delete',
                        url: `ai/v1/jobs/${snapshot.checkpoint.jobId}`,
                        headers: { 'x-lumo-resume-token': snapshot.checkpoint.token },
                    })
                )
            );
            expect(await getGenerationRecovery(id)).toBeUndefined();
            expect(state.conversations[id].status).toBe(ConversationStatus.COMPLETED);
            expect(api.mock.calls.map(([request]) => request.method)).toEqual(
                interruption === 'stop' ? ['post', 'delete'] : ['post', 'get', 'delete']
            );
            expect(open).not.toHaveBeenCalled();
            expect(write).not.toHaveBeenCalled();
        } finally {
            unmount?.();
            generationRegistry.abortAll();
            generationRegistry.finish(id);
            await generationRecoveryStore().remove(id);
            jest.restoreAllMocks();
            extraThunkArguments.dbApi = originalDb;
            extraThunkArguments.api = originalApi;
        }
    }
);
