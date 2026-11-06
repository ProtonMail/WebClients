import type { UnknownAction } from '@reduxjs/toolkit';
import { runSaga, stdChannel } from 'redux-saga';

import { attachmentDataCache } from '../../services/attachmentDataCache';
import type { Attachment, Conversation, Message, Space } from '../../types';
import { ConversationStatus, Role, SpaceType } from '../../types';
import { addAttachment, pushAttachmentRequest, pushAttachmentSuccess } from '../slices/core/attachments';
import {
    addConversation,
    locallyDeleteConversationFromLocalRequest,
    moveConversationToSpaceFailure,
    moveConversationToSpaceProgress,
    moveConversationToSpaceRequest,
    moveConversationToSpaceSuccess,
    pushConversationFailure,
    pushConversationRequest,
    pushConversationSuccess,
} from '../slices/core/conversations';
import { addMessage, pushMessageRequest, pushMessageSuccess } from '../slices/core/messages';
import { locallyDeleteSpaceFromLocalRequest } from '../slices/core/spaces';
import type { LumoState } from '../store';
import { syncingArtifactKeys } from './artifactAssetSyncState';
import { moveConversationToSpace } from './moveConversation';

// Stands in for the device: what `refreshMessageFromRemote` would store in IndexedDB and Redux.
const mockDevice = {
    idb: new Map<string, any>(),
    attachmentIdb: new Map<string, any>(),
    fullAttachments: new Map<string, any>(),
    state: undefined as any,
    // Makes the named deletion worker fail, after it has dispatched its request.
    failDeletion: undefined as 'conversation' | 'space' | 'attachment' | undefined,
};
// The deletion workers run inline (not through their takeEvery watchers), so a failure reaches the saga.
jest.mock('./conversations', () => {
    const { put } = jest.requireActual('redux-saga/effects');
    const slice = jest.requireActual('../slices/core/conversations');
    return {
        // What `GET conversation` brought in: `payload.fresh` is the newer metadata to merge into Redux.
        refreshConversationFromRemote: function* ({ payload }: any) {
            const current = mockDevice.state.conversations[payload.id];
            mockDevice.state.conversations[payload.id] = { ...current, ...payload.fresh };
        },
        softDeleteConversationFromLocal: function* ({ payload }: any) {
            yield put(slice.locallyDeleteConversationFromLocalRequest(payload));
            if (mockDevice.failDeletion === 'conversation') {
                throw new Error('conversation deletion failed');
            }
        },
    };
});
jest.mock('./spaces', () => {
    const { put } = jest.requireActual('redux-saga/effects');
    const slice = jest.requireActual('../slices/core/spaces');
    return {
        softDeleteSpaceFromLocal: function* ({ payload }: any) {
            yield put(slice.locallyDeleteSpaceFromLocalRequest(payload));
            if (mockDevice.failDeletion === 'space') {
                throw new Error('space deletion failed');
            }
        },
    };
});
jest.mock('./attachments', () => ({
    softDeleteAttachmentFromLocal: function* ({ payload }: any) {
        const { put } = jest.requireActual('redux-saga/effects');
        const slice = jest.requireActual('../slices/core/attachments');
        yield put(slice.locallyDeleteAttachmentFromLocalRequest(payload));
        if (mockDevice.failDeletion === 'attachment') {
            throw new Error('attachment deletion failed');
        }
    },
    deserializeAttachmentSaga: function* (serialized: any) {
        return mockDevice.fullAttachments.get(serialized.id);
    },
    refreshFilledAttachmentFromRemote: function* ({ payload }: any) {
        const full = { id: payload.id, spaceId: payload.spaceId, filename: 'remote.png', uploadedAt: 'now', data: new Uint8Array([7]) };
        mockDevice.attachmentIdb.set(payload.id, { id: payload.id, spaceId: payload.spaceId, encrypted: 'enc' });
        mockDevice.fullAttachments.set(payload.id, full);
        mockDevice.state.attachments[payload.id] = full;
        attachmentDataCache.setData(payload.id, full.data);
    },
}));
jest.mock('./messages', () => ({
    refreshMessageFromRemote: function* ({ payload }: any) {
        mockDevice.idb.set(payload.id, payload);
        mockDevice.state.messages[payload.id] = {
            id: payload.id,
            createdAt: payload.createdAt,
            role: payload.role,
            conversationId: payload.conversationId,
            parentId: payload.parentId,
            content: `full-${payload.id}`,
        };
    },
}));

const SOURCE = 'source-space';
const ATTEMPT = 'attempt-1';
const TARGET = 'project-space';

const conversation = (overrides: Partial<Conversation> = {}): Conversation => ({
    id: 'conv-1',
    spaceId: SOURCE,
    title: 'A chat',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    starred: true,
    status: ConversationStatus.COMPLETED,
    ...overrides,
});

const message = (id: string, createdAt: string, overrides: Partial<Message> = {}): Message => ({
    id,
    createdAt,
    role: Role.User,
    conversationId: 'conv-1',
    content: id,
    ...overrides,
});

const createState = ({
    source = { id: SOURCE, spaceType: SpaceType.Default } as Space,
    conv = conversation(),
    messages = [
        message('m1', '2026-01-01T00:00:01.000Z'),
        message('m2', '2026-01-01T00:00:02.000Z', { role: Role.Assistant, parentId: 'm1' }),
    ],
    attachments = [],
    idmap = { local2remote: {} },
}: {
    source?: Space;
    conv?: Conversation;
    messages?: Message[];
    attachments?: Attachment[];
    idmap?: unknown;
} = {}): LumoState =>
    ({
        spaces: {
            [SOURCE]: source,
            [TARGET]: { id: TARGET, spaceType: SpaceType.Project } as Space,
        },
        conversations: { [conv.id]: conv },
        messages: Object.fromEntries(messages.map((m) => [m.id, m])),
        attachments: Object.fromEntries(attachments.map((a) => [a.id, a])),
        idmap,
    }) as unknown as LumoState;

/** Runs the saga, answering every push request like a server would (or failing conversation pushes). */
const dbApi = {
    softDeleteMessage: jest.fn(),
    getMessageById: jest.fn(async (id: string) => mockDevice.idb.get(id)),
    getAttachmentById: jest.fn(async (id: string) => mockDevice.attachmentIdb.get(id)),
};

const run = async (
    state: LumoState,
    {
        failConversationPush = false,
        lumoApi = {} as any,
        // Runs while the copy is syncing, to simulate something else changing the original meanwhile.
        duringSync,
    }: { failConversationPush?: boolean; lumoApi?: any; duringSync?: () => void } = {}
) => {
    mockDevice.state = state;
    const channel = stdChannel<UnknownAction>();
    const dispatched: UnknownAction[] = [];

    const task = runSaga(
        {
            channel,
            context: { dbApi, lumoApi },
            dispatch: (action: UnknownAction) => {
                dispatched.push(action);
                // Answer asynchronously, like the real push sagas.
                setTimeout(() => {
                    let outcome: UnknownAction | undefined;
                    if (pushConversationRequest.match(action)) {
                        duringSync?.();
                        outcome = failConversationPush
                            ? pushConversationFailure({ id: action.payload.id, error: 'boom' })
                            : pushConversationSuccess({ id: action.payload.id });
                    } else if (pushMessageRequest.match(action)) {
                        outcome = pushMessageSuccess({ id: action.payload.id });
                    } else if (pushAttachmentRequest.match(action)) {
                        outcome = pushAttachmentSuccess({ id: action.payload.id });
                    }
                    if (outcome) {
                        dispatched.push(outcome);
                        channel.put(outcome);
                    }
                }, 0);
                channel.put(action);
            },
            getState: () => state,
        },
        moveConversationToSpace,
        moveConversationToSpaceRequest({ conversationId: 'conv-1', targetSpaceId: TARGET, attemptId: ATTEMPT })
    );
    await task.toPromise();

    return dispatched;
};

describe('moveConversationToSpace saga', () => {
    beforeEach(() => {
        dbApi.softDeleteMessage.mockReset();
        mockDevice.idb.clear();
        mockDevice.attachmentIdb.clear();
        mockDevice.fullAttachments.clear();
        mockDevice.failDeletion = undefined;
        syncingArtifactKeys.clear();
        ['img-1', 'remote-file', 'late-file', 'fresh-file'].forEach((id) => attachmentDataCache.delete(id));
    });

    describe('a remote chat that was never opened on this device', () => {
        const remoteMessage = (id: string, createdAt: string, parentId?: string, encrypted?: string) => ({
            id,
            createdAt,
            role: Role.User,
            conversationId: 'conv-1',
            parentId,
            remoteId: `remote-${id}`,
            remoteConversationId: 'remote-conv-1',
            ...(encrypted && { encrypted }),
        });
        const shallowList = [
            remoteMessage('m1', '2026-01-01T00:00:01.000Z'),
            remoteMessage('m2', '2026-01-01T00:00:02.000Z', 'm1'),
        ];
        // The space-list pull brought the chat but none of its messages.
        const neverOpenedState = () => {
            const state = createState({ messages: [] }) as any;
            state.idmap = { local2remote: { conversation: { 'conv-1': 'remote-conv-1' } } };
            return state as LumoState;
        };

        it('fetches the full messages and copies them before deleting the original', async () => {
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({ conversation: { id: 'conv-1' }, messages: shallowList }),
                getMessage: jest.fn(async (remoteId: string) => {
                    const id = remoteId.replace('remote-', '');
                    return { ...shallowList.find((m) => m.id === id)!, encrypted: `enc-${id}` };
                }),
            };

            const dispatched = await run(neverOpenedState(), { lumoApi });

            expect(lumoApi.getMessage).toHaveBeenCalledTimes(2);
            const copied = dispatched.filter(addMessage.match).map((a) => a.payload as Message);
            expect(copied.map((m) => m.content)).toEqual(['full-m1', 'full-m2']);
            expect(dispatched).toContainEqual(locallyDeleteSpaceFromLocalRequest(SOURCE));
            expect(dispatched.at(-1)).toMatchObject({ type: moveConversationToSpaceSuccess.type });
        });

        it('does not refetch messages that are already complete on the device', async () => {
            mockDevice.idb.set('m1', { id: 'm1', encrypted: 'enc-m1' });
            const state = neverOpenedState();
            (state as any).messages.m1 = message('m1', '2026-01-01T00:00:01.000Z');
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({ conversation: { id: 'conv-1' }, messages: shallowList }),
                getMessage: jest.fn(async () => ({ ...shallowList[1], encrypted: 'enc-m2' })),
            };

            await run(state, { lumoApi });

            expect(lumoApi.getMessage).toHaveBeenCalledTimes(1);
            expect(lumoApi.getMessage).toHaveBeenCalledWith('remote-m2', 'conv-1', 'm1', 'remote-conv-1');
        });

        it.each([
            ['the message cannot be fetched', () => jest.fn().mockResolvedValue(null)],
            ['the request fails', () => jest.fn().mockRejectedValue(new Error('offline'))],
        ])('aborts without copying or deleting anything when %s', async (_name, getMessage) => {
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({ conversation: { id: 'conv-1' }, messages: shallowList }),
                getMessage: getMessage(),
            };

            const dispatched = await run(neverOpenedState(), { lumoApi });

            expect(dispatched.some(addConversation.match)).toBe(false);
            expect(dispatched.some(addMessage.match)).toBe(false);
            expect(dispatched.some(locallyDeleteSpaceFromLocalRequest.match)).toBe(false);
            expect(dispatched.some(locallyDeleteConversationFromLocalRequest.match)).toBe(false);
            expect(dbApi.softDeleteMessage).not.toHaveBeenCalled();
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'unavailable' },
            });
        });

        it('aborts when the conversation cannot be fetched', async () => {
            const lumoApi = { getConversation: jest.fn().mockRejectedValue(new Error('offline')), getMessage: jest.fn() };

            const dispatched = await run(neverOpenedState(), { lumoApi });

            expect(dispatched.some(addConversation.match)).toBe(false);
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'unavailable' },
            });
        });
    });

    describe('files and generated images', () => {
        const generatedImage = {
            id: 'img-1',
            spaceId: SOURCE,
            filename: 'image.png',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            mimeType: 'image/png',
            role: 'assistant',
            generatedArtifactAsset: {
                conversationId: 'conv-1',
                artifactId: 'a1',
                artifactType: 'document',
                artifactTitle: 'Doc',
            },
        } as unknown as Attachment;
        const imageText = '\n\n![Generated image](attachment:img-1)\n\n';

        const stateWithGeneratedImage = () => {
            attachmentDataCache.setData('img-1', new Uint8Array([1, 2]));
            return createState({
                attachments: [generatedImage],
                messages: [
                    message('m1', '2026-01-01T00:00:01.000Z'),
                    message('m2', '2026-01-01T00:00:02.000Z', {
                        role: Role.Assistant,
                        parentId: 'm1',
                        content: imageText,
                        blocks: [{ type: 'text', content: imageText }],
                        attachments: [{ id: 'img-1', spaceId: SOURCE } as any],
                    }),
                ],
            });
        };

        it('rewrites generated image URLs in the content and the text blocks to the copied file', async () => {
            const dispatched = await run(stateWithGeneratedImage());

            const copiedFile = dispatched.find(addAttachment.match)!.payload;
            expect(copiedFile.id).not.toBe('img-1');
            const copiedMessage = dispatched
                .filter(addMessage.match)
                .map((a) => a.payload as Message)
                .find((m) => m.content?.includes('attachment:'))!;
            expect(copiedMessage.content).toBe(`\n\n![Generated image](attachment:${copiedFile.id})\n\n`);
            expect(copiedMessage.blocks).toEqual([{ type: 'text', content: copiedMessage.content }]);
            expect(copiedMessage.content).not.toContain('img-1');
        });

        it('points copied generated files at the new chat, so the Library opens the copy', async () => {
            const dispatched = await run(stateWithGeneratedImage());

            const copiedFile = dispatched.find(addAttachment.match)!.payload;
            const newConversation = dispatched.find(addConversation.match)!.payload;
            expect(copiedFile.generatedArtifactAsset?.conversationId).toBe(newConversation.id);
        });

        describe('when the file only exists on the server', () => {
            const remoteFileMessages = () => [
                message('m1', '2026-01-01T00:00:01.000Z', {
                    attachments: [{ id: 'remote-file', spaceId: SOURCE } as any],
                }),
            ];
            const remoteFileState = () =>
                createState({
                    messages: remoteFileMessages(),
                    idmap: { local2remote: { attachment: { 'remote-file': 'remote-asset-1' } } },
                });

            it('downloads it and copies it instead of skipping it', async () => {
                const lumoApi = {
                    getAttachment: jest
                        .fn()
                        .mockResolvedValue({ id: 'remote-file', spaceId: SOURCE, encrypted: 'enc', deleted: undefined }),
                };

                const dispatched = await run(remoteFileState(), { lumoApi });

                expect(lumoApi.getAttachment).toHaveBeenCalledWith('remote-asset-1', SOURCE);
                const copiedFile = dispatched.find(addAttachment.match)!.payload;
                expect(copiedFile.spaceId).toBe(TARGET);
                const copiedMessage = dispatched.find(addMessage.match)!.payload as Message;
                expect(copiedMessage.attachments?.[0].id).toBe(copiedFile.id);
                expect(dispatched.at(-1)).toMatchObject({ type: moveConversationToSpaceSuccess.type });
            });

            it.each([
                ['the server has no such file', () => jest.fn().mockResolvedValue(null)],
                ['the download fails', () => jest.fn().mockRejectedValue(new Error('offline'))],
            ])('aborts without deleting anything when %s', async (_name, getAttachment) => {
                const dispatched = await run(remoteFileState(), { lumoApi: { getAttachment: getAttachment() } });

                expect(dispatched.some(addConversation.match)).toBe(false);
                expect(dispatched.some(locallyDeleteSpaceFromLocalRequest.match)).toBe(false);
                expect(dispatched.at(-1)).toMatchObject({
                    type: moveConversationToSpaceFailure.type,
                    payload: { reason: 'unavailable' },
                });
            });

            it('leaves out a file that was deleted on the server', async () => {
                const lumoApi = { getAttachment: jest.fn().mockResolvedValue({ id: 'remote-file', deleted: true }) };

                const dispatched = await run(remoteFileState(), { lumoApi });

                expect(dispatched.some(addAttachment.match)).toBe(false);
                expect(dispatched.at(-1)).toMatchObject({ type: moveConversationToSpaceSuccess.type });
            });
        });
    });

    describe('when removing the original fails after the copy is verified', () => {
        const keepsCopy = (dispatched: UnknownAction[]) => {
            const newConversation = dispatched.find(addConversation.match)!.payload;
            expect(dispatched).not.toContainEqual(locallyDeleteConversationFromLocalRequest(newConversation.id));
            expect(dispatched.some(moveConversationToSpaceFailure.match)).toBe(false);
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceSuccess.type,
                payload: { newConversationId: newConversation.id, cleanupFailed: true },
            });
        };

        it('reports it when the source conversation deletion worker fails, without purging its messages', async () => {
            mockDevice.failDeletion = 'conversation';

            const dispatched = await run(
                createState({ source: { id: SOURCE, spaceType: SpaceType.Project } as Space })
            );

            keepsCopy(dispatched);
            // Purging while the conversation is still alive would leave an empty original behind.
            expect(dbApi.softDeleteMessage).not.toHaveBeenCalled();
        });

        it('reports it when the source space deletion worker fails (default-space move)', async () => {
            mockDevice.failDeletion = 'space';

            const dispatched = await run(createState());

            keepsCopy(dispatched);
        });
    });

    describe('a generated file finishing while the chat is moved', () => {
        const artifactPointers = { a1: { attachmentId: 'late-file', syncedMessageId: 'm2' } };

        it('refuses to start while an upload for the chat is still running', async () => {
            syncingArtifactKeys.add('conv-1:a1');

            const dispatched = await run(createState());

            expect(dispatched.some(addConversation.match)).toBe(false);
            expect(dispatched.some(locallyDeleteSpaceFromLocalRequest.match)).toBe(false);
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'busy' },
            });
        });

        it('aborts and rolls back when an upload lands while the copy syncs, instead of deleting the new file', async () => {
            const state = createState();

            const dispatched = await run(state, {
                duringSync: () => {
                    (state.conversations as any)['conv-1'] = { ...state.conversations['conv-1'], artifactAssets: artifactPointers };
                },
            });

            const copy = dispatched.find(addConversation.match)!.payload;
            expect(dispatched).toContainEqual(locallyDeleteConversationFromLocalRequest(copy.id));
            expect(dispatched).not.toContainEqual(locallyDeleteSpaceFromLocalRequest(SOURCE));
            expect(dispatched).not.toContainEqual(locallyDeleteConversationFromLocalRequest('conv-1'));
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'busy' },
            });
        });

        it('aborts when an upload for the chat starts while the copy syncs', async () => {
            const dispatched = await run(createState(), { duringSync: () => syncingArtifactKeys.add('conv-1:a1') });

            expect(dispatched).not.toContainEqual(locallyDeleteSpaceFromLocalRequest(SOURCE));
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'busy' },
            });
        });

        it('copies the pointers that were already there when nothing changes', async () => {
            attachmentDataCache.setData('late-file', new Uint8Array([3]));
            const state = createState({
                conv: conversation({ artifactAssets: artifactPointers }),
                attachments: [
                    { id: 'late-file', spaceId: SOURCE, filename: 'doc.pdf', uploadedAt: 'now' } as unknown as Attachment,
                ],
            });

            const dispatched = await run(state);

            const copiedFile = dispatched.find(addAttachment.match)!.payload;
            expect(dispatched.find(addConversation.match)!.payload.artifactAssets?.a1.attachmentId).toBe(copiedFile.id);
            expect(dispatched.at(-1)).toMatchObject({ type: moveConversationToSpaceSuccess.type });
        });
    });

    describe('conversation metadata', () => {
        it('uses the metadata from the server, and copies a file that only that metadata points to', async () => {
            const state = createState({ messages: [] }) as any;
            state.idmap = {
                local2remote: { conversation: { 'conv-1': 'remote-conv-1' }, space: { [SOURCE]: 'remote-space' } },
            };
            const pointers = { a1: { attachmentId: 'fresh-file', syncedMessageId: 'm9' } };
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({
                    conversation: { id: 'conv-1', fresh: { artifactAssets: pointers, title: 'Renamed elsewhere' } },
                    messages: [],
                }),
                getMessage: jest.fn(),
                // The file was created on another device: only the space (not the conversation) lists it.
                getSpace: jest.fn().mockResolvedValue({
                    assets: [{ id: 'fresh-file', remoteId: 'remote-fresh', spaceId: SOURCE }],
                    deletedAssets: [],
                }),
                getAttachment: jest
                    .fn()
                    .mockResolvedValue({ id: 'fresh-file', spaceId: SOURCE, encrypted: 'enc', deleted: undefined }),
            };

            const dispatched = await run(state, { lumoApi });

            expect(lumoApi.getSpace).toHaveBeenCalledWith('remote-space');
            expect(lumoApi.getAttachment).toHaveBeenCalledWith('remote-fresh', SOURCE);
            const copy = dispatched.find(addConversation.match)!.payload;
            const copiedFile = dispatched.find(addAttachment.match)!.payload;
            expect(copy.title).toBe('Renamed elsewhere');
            expect(copiedFile.spaceId).toBe(TARGET);
            expect(copiedFile.id).not.toBe('fresh-file');
            expect(copy.artifactAssets?.a1.attachmentId).toBe(copiedFile.id);
        });

        it('aborts instead of dropping a referenced file that cannot be located anywhere', async () => {
            const state = createState({ messages: [] }) as any;
            state.idmap = {
                local2remote: { conversation: { 'conv-1': 'remote-conv-1' }, space: { [SOURCE]: 'remote-space' } },
            };
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({
                    conversation: {
                        id: 'conv-1',
                        fresh: { artifactAssets: { a1: { attachmentId: 'ghost', syncedMessageId: 'm9' } } },
                    },
                    messages: [],
                }),
                getMessage: jest.fn(),
                getSpace: jest.fn().mockResolvedValue({ assets: [], deletedAssets: [] }),
                getAttachment: jest.fn(),
            };

            const dispatched = await run(state, { lumoApi });

            expect(lumoApi.getAttachment).not.toHaveBeenCalled();
            expect(dispatched.some(addConversation.match)).toBe(false);
            expect(dispatched.some(locallyDeleteSpaceFromLocalRequest.match)).toBe(false);
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'unavailable' },
            });
        });

        it('leaves out a referenced file the server lists as deleted', async () => {
            const state = createState({ messages: [] }) as any;
            state.idmap = {
                local2remote: { conversation: { 'conv-1': 'remote-conv-1' }, space: { [SOURCE]: 'remote-space' } },
            };
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({
                    conversation: {
                        id: 'conv-1',
                        fresh: { artifactAssets: { a1: { attachmentId: 'old-file', syncedMessageId: 'm9' } } },
                    },
                    messages: [],
                }),
                getMessage: jest.fn(),
                getSpace: jest.fn().mockResolvedValue({ assets: [], deletedAssets: [{ id: 'old-file' }] }),
                getAttachment: jest.fn(),
            };

            const dispatched = await run(state, { lumoApi });

            expect(dispatched.some(addAttachment.match)).toBe(false);
            expect(dispatched.at(-1)).toMatchObject({ type: moveConversationToSpaceSuccess.type });
        });

        it.each([
            ['renamed', { title: 'Renamed during the move' }],
            ['starred or unstarred', { starred: false }],
        ])('aborts and keeps the original when the chat is %s while the copy syncs', async (_name, change) => {
            const state = createState();

            const dispatched = await run(state, {
                duringSync: () => {
                    (state.conversations as any)['conv-1'] = { ...state.conversations['conv-1'], ...change };
                },
            });

            const copy = dispatched.find(addConversation.match)!.payload;
            expect(dispatched).toContainEqual(locallyDeleteConversationFromLocalRequest(copy.id));
            expect(dispatched).not.toContainEqual(locallyDeleteSpaceFromLocalRequest(SOURCE));
            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { reason: 'busy', attemptId: ATTEMPT },
            });
        });

        it('ignores changes that are not carried over, like the status and update time', async () => {
            const state = createState();

            const dispatched = await run(state, {
                duringSync: () => {
                    (state.conversations as any)['conv-1'] = {
                        ...state.conversations['conv-1'],
                        updatedAt: '2026-02-02T00:00:00.000Z',
                    };
                },
            });

            expect(dispatched.at(-1)).toMatchObject({ type: moveConversationToSpaceSuccess.type });
        });
    });

    describe('attempts', () => {
        it('reports the attempt id on a refusal, so a duplicate request cannot be mistaken for the first one', async () => {
            const dispatched = await run(createState({ conv: conversation({ status: ConversationStatus.GENERATING }) }));

            expect(dispatched.at(-1)).toMatchObject({
                type: moveConversationToSpaceFailure.type,
                payload: { attemptId: ATTEMPT },
            });
        });
    });

    describe('cleanup after the copy is verified', () => {
        it('keeps the copy and reports it when purging the original messages fails', async () => {
            dbApi.softDeleteMessage.mockRejectedValue(new Error('idb failure'));

            const dispatched = await run(
                createState({ source: { id: SOURCE, spaceType: SpaceType.Project } as Space })
            );

            const newConversation = dispatched.find(addConversation.match)!.payload;
            // The source deletion went through, so the destination is now the only complete copy.
            expect(dispatched).toContainEqual(locallyDeleteConversationFromLocalRequest('conv-1'));
            expect(dispatched).not.toContainEqual(locallyDeleteConversationFromLocalRequest(newConversation.id));
            expect(dispatched.some(moveConversationToSpaceFailure.match)).toBe(false);
            expect(dispatched.at(-1)).toEqual(
                moveConversationToSpaceSuccess({
                    conversationId: 'conv-1',
                    targetSpaceId: TARGET,
                    attemptId: ATTEMPT,
                    newConversationId: newConversation.id,
                    cleanupFailed: true,
                })
            );
        });
    });

    describe('progress', () => {
        const stages = (dispatched: UnknownAction[]) =>
            dispatched.filter(moveConversationToSpaceProgress.match).map((a) => a.payload.stage);

        it('reports copying and finishing for a chat that is already complete locally', async () => {
            const dispatched = await run(createState());

            expect(stages(dispatched)).toEqual(['copying', 'finishing']);
            expect(dispatched.find(moveConversationToSpaceProgress.match)!.payload.total).toBe(3);
        });

        it('also reports loading while a chat is fetched from the server', async () => {
            const state = createState({ messages: [] }) as any;
            state.idmap = { local2remote: { conversation: { 'conv-1': 'remote-conv-1' } } };
            const lumoApi = {
                getConversation: jest.fn().mockResolvedValue({ conversation: { id: 'conv-1' }, messages: [] }),
                getMessage: jest.fn(),
            };

            const dispatched = await run(state, { lumoApi });

            expect(stages(dispatched)).toEqual(['loading', 'copying', 'finishing']);
        });

        it('does not report finishing when the move is refused', async () => {
            const dispatched = await run(createState({ conv: conversation({ status: ConversationStatus.GENERATING }) }));

            expect(stages(dispatched)).toEqual([]);
        });
    });

    it('copies the chat into the project with remapped ids, then deletes the legacy 1:1 space', async () => {
        const dispatched = await run(createState());

        const added = dispatched.find(addConversation.match)!.payload;
        expect(added.spaceId).toBe(TARGET);
        expect(added.id).not.toBe('conv-1');
        expect(added.title).toBe('A chat');
        expect(added.starred).toBe(true);

        const addedMessages = dispatched.filter(addMessage.match).map((a) => a.payload as Message);
        expect(addedMessages).toHaveLength(2);
        expect(addedMessages.every((m) => m.conversationId === added.id)).toBe(true);
        expect(addedMessages.map((m) => m.id)).not.toContain('m1');
        expect(addedMessages[1].parentId).toBe(addedMessages[0].id);

        // The original is only removed once the copy is synced.
        const lastPushSuccess = dispatched.findLastIndex(
            (a) => pushMessageSuccess.match(a) || pushConversationSuccess.match(a)
        );
        const spaceDelete = dispatched.findIndex(locallyDeleteSpaceFromLocalRequest.match);
        expect(spaceDelete).toBeGreaterThan(lastPushSuccess);
        expect(dispatched).toContainEqual(locallyDeleteSpaceFromLocalRequest(SOURCE));

        expect(dispatched.at(-1)).toEqual(
            moveConversationToSpaceSuccess({
                conversationId: 'conv-1',
                targetSpaceId: TARGET,
                attemptId: ATTEMPT,
                newConversationId: added.id,
            })
        );
    });

    it('only deletes the chat, not its space, when moving between projects', async () => {
        const dispatched = await run(createState({ source: { id: SOURCE, spaceType: SpaceType.Project } as Space }));

        expect(dispatched).toContainEqual(locallyDeleteConversationFromLocalRequest('conv-1'));
        expect(dispatched.some(locallyDeleteSpaceFromLocalRequest.match)).toBe(false);
        // The original messages don't linger once the chat is moved.
        expect(dbApi.softDeleteMessage).toHaveBeenCalledWith('m1', { dirty: true });
        expect(dbApi.softDeleteMessage).toHaveBeenCalledWith('m2', { dirty: true });
    });

    it('refuses to move a chat out of a private project into a non-private one', async () => {
        const state = createState({ source: { id: SOURCE, spaceType: SpaceType.Project, isPrivate: true } as Space });
        const dispatched = await run(state);

        expect(dispatched.some(addConversation.match)).toBe(false);
        expect(dispatched.at(-1)).toMatchObject({
            type: moveConversationToSpaceFailure.type,
            payload: { reason: 'privacy' },
        });
    });

    it('keeps the original and rolls back the copy when syncing fails', async () => {
        const dispatched = await run(createState(), { failConversationPush: true });

        const added = dispatched.find(addConversation.match)!.payload;
        expect(dispatched).toContainEqual(locallyDeleteConversationFromLocalRequest(added.id));
        expect(dispatched).not.toContainEqual(locallyDeleteConversationFromLocalRequest('conv-1'));
        expect(dispatched.some(locallyDeleteSpaceFromLocalRequest.match)).toBe(false);
        expect(dispatched.at(-1)).toMatchObject({
            type: moveConversationToSpaceFailure.type,
            payload: { conversationId: 'conv-1', error: 'boom' },
        });
    });

    it('refuses to move a chat that is generating a response', async () => {
        const dispatched = await run(createState({ conv: conversation({ status: ConversationStatus.GENERATING }) }));

        expect(dispatched.some(addConversation.match)).toBe(false);
        expect(dispatched.at(-1)).toMatchObject({
            type: moveConversationToSpaceFailure.type,
            payload: { reason: 'busy' },
        });
    });

    it('refuses to move a chat into the space it already lives in', async () => {
        const state = createState({ conv: conversation({ spaceId: TARGET }) });
        const dispatched = await run(state);

        expect(dispatched.some(addConversation.match)).toBe(false);
        expect(dispatched.at(-1)).toMatchObject({
            type: moveConversationToSpaceFailure.type,
            payload: { reason: 'unsupported' },
        });
    });
});
