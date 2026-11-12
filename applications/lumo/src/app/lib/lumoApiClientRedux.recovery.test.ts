import type { UnknownAction } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { runSaga, stdChannel } from 'redux-saga';
import { TransformStream } from 'stream/web';

import { useApi } from '@proton/app-context/useApi';
import { newRecoveryState } from '@proton/lumo-api-client/core/recovery';
import type { ChatCompletionsRequest } from '@proton/lumo-api-client/types-api';
import type { FetchConfig } from '@proton/shared/lib/fetch/interface';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { generateMasterKeyBase64, generateSpaceKeyBase64 } from '../crypto';
import { useGenerationRecovery } from '../hooks/useGenerationRecovery';
import { useLumoFlags } from '../hooks/useLumoFlags';
import type { DbApi } from '../indexedDb/db';
import { GenerationRecoveryDb } from '../indexedDb/generationRecoveryDb';
import { useLumoSelector, useLumoStore } from '../redux/hooks';
import { pushMessage } from '../redux/sagas/messages';
import attachmentsReducer, { pushAttachmentFailure, pushAttachmentRequest } from '../redux/slices/core/attachments';
import idmapReducer, { addIdMapEntry } from '../redux/slices/core/idmap';
import messagesReducer, { addMessage, pushMessageRequest } from '../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../redux/store';
import { extraThunkArguments } from '../redux/thunk';
import type { Priority } from '../remote/scheduler';
import type { NewMessageToApi } from '../remote/types';
import { attachmentDataCache } from '../services/attachmentDataCache';
import { cancelConversationGeneration } from '../services/generation/abortGeneration';
import { generationRegistry } from '../services/generation/generationRegistry';
import type { RecoveryRecord } from '../services/generation/recovery';
import { Role, SpaceType } from '../types';
import type { SerializedAttachment, SerializedMessage } from '../types';
import { sendMessageWithRedux } from './lumoApiClientRedux';

jest.mock('@proton/app-context/useApi');
jest.mock('../hooks/useLumoFlags');
jest.mock('../redux/hooks');

Object.assign(globalThis, { TransformStream });

it.each([
    { mode: 'normal', image: 'none', stopAt: 'never' },
    { mode: 'resumed', image: 'none', stopAt: 'never' },
    { mode: 'normal', image: 'pending', stopAt: 'never' },
    { mode: 'resumed', image: 'pending', stopAt: 'never' },
    { mode: 'normal', image: 'uploaded', stopAt: 'never' },
    { mode: 'resumed', image: 'uploaded', stopAt: 'never' },
    { mode: 'normal', image: 'none', stopAt: 'before-save' },
    { mode: 'normal', image: 'none', stopAt: 'after-save' },
    { mode: 'normal', image: 'pending', stopAt: 'before-save' },
    { mode: 'normal', image: 'pending', stopAt: 'after-save' },
    { mode: 'resumed', image: 'none', stopAt: 'before-save' },
    { mode: 'resumed', image: 'none', stopAt: 'after-save' },
])('acknowledges $mode generation, image upload $image, stop $stopAt', async ({ mode, image, stopAt }) => {
    jest.spyOn(generationRegistry, 'canRecover').mockReturnValue(true);
    const withImage = image !== 'none';
    const originalDb = extraThunkArguments.dbApi;
    const originalApi = extraThunkArguments.api;
    const checkpointGate = Promise.withResolvers<void>();
    const cancellationGate = Promise.withResolvers<ReadableStream>();
    let stopped = false;
    const masterKey = generateMasterKeyBase64();
    const recovery = new GenerationRecoveryDb(crypto.randomUUID(), () => ({
        primaryMasterKeyId: 'key',
        primaryMasterKey: masterKey,
        masterKeys: { key: masterKey },
    }));
    const now = new Date().toISOString();
    const record: RecoveryRecord = {
        checkpoint: newRecoveryState([{ role: Role.User, content: 'Hello' }], 'message'),
        options: {},
        config: { enableU2LEncryption: false, enableSmoothing: false },
        space: {
            id: 'space',
            spaceKey: generateSpaceKeyBase64(),
            spaceType: SpaceType.Default,
            createdAt: now,
            updatedAt: now,
        },
        conversation: { id: 'conversation', spaceId: 'space', title: 'Chat', createdAt: now, updatedAt: now },
        message: {
            id: 'assistant',
            conversationId: 'conversation',
            role: Role.Assistant,
            createdAt: now,
            placeholder: true,
        },
        ancestors: [],
        attachments: [],
    };
    const state = {
        messages: {},
        conversations: { conversation: record.conversation },
        spaces: { space: record.space },
        attachments: {},
        idmap: idmapReducer(
            undefined,
            addIdMapEntry({
                type: 'conversation',
                localId: 'conversation',
                remoteId: 'remote-conversation',
                saveToIdb: false,
            })
        ),
    } as unknown as LumoState;
    const savedAttachments = new Map<string, SerializedAttachment>();
    let saved: SerializedMessage | undefined;
    const dbApi = {
        recovery,
        getAttachmentById: async (id: string) => savedAttachments.get(id),
        updateAttachment: async (attachment: SerializedAttachment) => {
            savedAttachments.set(attachment.id, attachment);
        },
        getConversationById: async () => undefined,
        getMessageById: async () => saved,
        updateMessage: async (message: SerializedMessage, { dirty }: { dirty: boolean }) => {
            saved = { ...message, dirty };
        },
    } as unknown as DbApi;
    extraThunkArguments.dbApi = dbApi;
    const channel = stdChannel();
    const postMessage = jest.fn<Promise<string>, [NewMessageToApi, Priority]>(async () => 'remote-assistant');
    const pushes: Promise<unknown>[] = [];
    const uploads: string[] = [];
    const dispatch = ((action: UnknownAction | ReturnType<typeof sendMessageWithRedux>) => {
        if (typeof action === 'function') {
            return action(dispatch, () => state);
        }
        state.messages = messagesReducer(state.messages, action);
        state.attachments = attachmentsReducer(state.attachments, action);
        state.idmap = idmapReducer(state.idmap, action);
        channel.put(action);
        if (pushAttachmentRequest.match(action)) {
            uploads.push(action.payload.id);
        }
        if (pushMessageRequest.match(action)) {
            pushes.push(
                runSaga(
                    { channel, context: { dbApi, lumoApi: { postMessage } }, getState: () => state, dispatch },
                    pushMessage,
                    action
                ).toPromise()
            );
        }
        return action;
    }) as LumoDispatch;
    const api = jest.fn<Promise<ReadableStream>, [FetchConfig]>(
        async () =>
            new ReadableStream({
                start(controller) {
                    controller.enqueue(
                        new TextEncoder().encode(
                            'data: {"choices":[{"index":0,"delta":{"content":"Recovered answer"}}]}\n\n' +
                                (withImage
                                    ? 'data: {"object":"lumo.image_data","image":{"id":"image","data":"aW1hZ2UtYnl0ZXM=","encrypted":false}}\n\n'
                                    : '') +
                                'data: [DONE]\n\n'
                        )
                    );
                    controller.close();
                },
            })
    );
    extraThunkArguments.api = api as unknown as typeof originalApi;
    const streamApi = api.getMockImplementation()!;
    api.mockImplementation(async (request) => {
        if (request.method === 'delete') {
            return cancellationGate.promise;
        }
        return streamApi(request);
    });
    const writeCheckpoint = recovery.save.bind(recovery);
    const removeCheckpoint = jest.spyOn(recovery, 'remove');
    jest.spyOn(recovery, 'save').mockImplementation(async (id, value, expiresAt, jobId) => {
        if (stopAt !== 'never' && !stopped && (value as RecoveryRecord).checkpoint.phase === 'completed') {
            if (stopAt === 'after-save') {
                await writeCheckpoint(id, value, expiresAt, jobId);
            }
            stopped = true;
            cancelConversationGeneration(dispatch, () => state, 'conversation');
            await checkpointGate.promise;
            if (stopAt === 'before-save') {
                await writeCheckpoint(id, value, expiresAt, jobId);
            }
            return;
        }
        await writeCheckpoint(id, value, expiresAt, jobId);
    });
    let unmount: (() => void) | undefined;
    jest.mocked(useApi).mockReturnValue(api as unknown as Api);
    jest.mocked(useLumoStore).mockReturnValue({ dispatch, getState: () => state } as ReturnType<typeof useLumoStore>);
    jest.mocked(useLumoSelector).mockReturnValue(masterKey);
    jest.mocked(useLumoFlags).mockReturnValue({ resumableGeneration: true } as ReturnType<typeof useLumoFlags>);
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    try {
        if (image === 'uploaded') {
            dispatch(
                addIdMapEntry({ type: 'attachment', localId: 'image', remoteId: 'remote-image', saveToIdb: false })
            );
        }
        let generation: Promise<unknown> | undefined;
        if (mode === 'resumed') {
            await recovery.save(
                'conversation',
                record,
                record.checkpoint.createdAt + 3_600_000,
                record.checkpoint.jobId
            );
            ({ unmount } = renderHook(() => useGenerationRecovery('conversation', true)));
        } else {
            const controller = generationRegistry.start('conversation');
            dispatch(addMessage(record.message));
            generation = dispatch(
                sendMessageWithRedux(api as unknown as Api, record.checkpoint.turns, {
                    config: record.config,
                    signal: controller.signal,
                    enableGenerationRecovery: true,
                    messageId: record.message.id,
                    conversationId: record.conversation.id,
                    spaceId: record.space.id,
                })
            ).finally(() => generationRegistry.finish('conversation'));
        }
        if (stopAt !== 'never') {
            await waitFor(() => expect(stopped).toBe(true));
            expect(generationRegistry.isInProgress('conversation')).toBe(true);
            expect(removeCheckpoint).not.toHaveBeenCalled();
            expect(await recovery.get('conversation')).toMatchObject({
                checkpoint: { phase: stopAt === 'before-save' ? 'streaming' : 'completed' },
            });
            if (mode === 'normal') {
                ({ unmount } = renderHook(() => useGenerationRecovery('conversation', true)));
            }
            await act(async () => {
                window.dispatchEvent(new Event('online'));
            });
            expect(api).toHaveBeenCalledTimes(1);
            checkpointGate.resolve();
        }
        await generation;
        await waitFor(() => expect(state.messages.assistant?.placeholder).toBe(false));
        if (stopAt !== 'never') {
            await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
            expect(api.mock.calls[1][0]).toMatchObject({ method: 'delete' });
        }
        expect(state.messages.assistant.content).toContain('Recovered answer');
        expect(state.messages.assistant).toMatchObject({ status: 'succeeded', placeholder: false });
        const request = api.mock.calls[0][0];
        const jobId =
            mode === 'resumed' ? record.checkpoint.jobId : (request.data as ChatCompletionsRequest).lumo!.job_id;
        const token =
            mode === 'resumed'
                ? record.checkpoint.token
                : (request.headers as Record<string, string>)['x-lumo-resume-token'];
        expect(request).toMatchObject({
            url: mode === 'resumed' ? `ai/v1/jobs/${jobId}/resume` : 'ai/v1/chat/completions',
            method: mode === 'resumed' ? 'get' : 'post',
        });
        if (image === 'pending') {
            await waitFor(() => expect(uploads).toEqual(['image', 'image']));
            expect(postMessage).not.toHaveBeenCalled();
            expect(saved).toMatchObject({ id: 'assistant', dirty: true });
            expect(saved).not.toHaveProperty('content');
            expect(attachmentDataCache.getData('image')).toEqual(new TextEncoder().encode('image-bytes'));
            dispatch(pushAttachmentFailure({ id: 'image', error: 'Upload failed' }));
            expect(postMessage).not.toHaveBeenCalled();
            expect(await recovery.get('conversation')).toMatchObject({
                checkpoint: { jobId, phase: 'completed' },
                message: { id: 'assistant', placeholder: false },
            });
            dispatch(
                addIdMapEntry({ type: 'attachment', localId: 'image', remoteId: 'remote-image', saveToIdb: false })
            );
        }
        await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
        await Promise.all(pushes);
        await waitFor(() => expect(generationRegistry.isInProgress('conversation')).toBe(false));
        expect(postMessage).toHaveBeenCalledWith(
            expect.objectContaining({ GenerationJobs: [{ JobID: jobId, Token: token }] }),
            'urgent'
        );
        expect(await recovery.get('conversation')).toBeUndefined();
        cancellationGate.resolve(
            new ReadableStream({
                start: (controller) => {
                    controller.close();
                },
            })
        );
        expect(await recovery.get('conversation')).toBeUndefined();
    } finally {
        checkpointGate.resolve();
        cancellationGate.resolve(
            new ReadableStream({
                start: (controller) => {
                    controller.close();
                },
            })
        );
        unmount?.();
        attachmentDataCache.delete('image');
        channel.close();
        generationRegistry.abortAll();
        jest.restoreAllMocks();
        extraThunkArguments.dbApi = originalDb;
        extraThunkArguments.api = originalApi;
        await recovery.dispose();
    }
});
