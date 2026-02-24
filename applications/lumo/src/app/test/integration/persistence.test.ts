import { type SetupServer, setupServer } from 'msw/node';

import { base64ToMasterKey, generateMasterKeyBase64, generateSpaceKeyBase64 } from '../../crypto';
import type { AesGcmCryptoKey } from '../../crypto/types';
import { CONVERSATION_STORE, DbApi, MESSAGE_STORE, SPACE_STORE } from '../../indexedDb/db';
import { _getCallbacks } from '../../llm';
import { setRetryPushEveryMs } from '../../redux/sagas';
import {
    selectAttachmentById,
    selectConversationById,
    selectMessageById,
    selectMessagesByConversationId,
    selectRemoteIdFromLocal,
} from '../../redux/selectors';
import { reloadReduxRequest, stopRootSaga, unloadReduxRequest } from '../../redux/slices/core';
import {
    locallyDeleteAttachmentFromLocalRequest,
    newAttachmentId,
    pushAttachmentRequest,
    upsertAttachment,
} from '../../redux/slices/core/attachments';
import {
    addConversation,
    newConversationId,
    pullConversationRequest,
    pushConversationRequest,
} from '../../redux/slices/core/conversations';
import {
    EMPTY_MESSAGE_MAP,
    addMessage,
    finishMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import {
    addSpace,
    deleteAllSpacesFailure,
    deleteAllSpacesRequest,
    deleteAllSpacesSuccess,
    locallyDeleteSpaceFromLocalRequest,
    newSpaceId,
    pullSpaceRequest,
    pullSpacesRequest,
    pushSpaceRequest,
} from '../../redux/slices/core/spaces';
import { LumoApi } from '../../remote/api';
import { RoleInt, StatusInt } from '../../remote/types';
import {
    deserializeAttachment,
    deserializeConversation,
    deserializeMessage,
    deserializeSpace,
    serializeConversation,
    serializeMessage,
    serializeSpace,
} from '../../serialization';
import type { Base64, SpaceId } from '../../types';
import {
    type ConversationId,
    ConversationStatus,
    type Message,
    type MessagePub,
    Role,
    type SerializedConversation,
    type SerializedMessage,
    type SerializedSpace,
    type Space,
    type Status,
    getSpaceDek,
} from '../../types';
import type { GenerationResponseMessage } from '../../types-api';
import { clarify } from '../../util/clarify';
import { listify, mapIds, mapLength, mapify, setify } from '../../util/collections';
import { sleep } from '../../util/date';
import {
    addTestDataToStore,
    createTestConversation,
    createTestData,
    createTestMessage,
    createTestSpace,
    expectConversationEqual,
    expectMessageEqual,
    expectSpaceEqual,
    fixedMasterKeyBytes,
    generateFakeUserId,
    generateTestSpacesOnMockServer,
    setupTestEnvironment,
    waitForAttachmentSyncWithServer,
    waitForCondition,
    waitForConversationSyncWithServer,
    waitForMessageSyncWithServer,
    waitForSpaceSyncWithServer,
    waitForValue,
} from './helpers';
import { MockDatabase, type MockDbSpace, MockErrorHandler, createHandlers } from './mock-server';

describe('Lumo Persistence Integration Tests', () => {
    let mockDb: MockDatabase;
    let server: SetupServer;
    let mockErrorHandler: MockErrorHandler;
    let allowConsoleError: boolean = false;
    let allowConsoleWarn: boolean = false;

    const originalError = console.error;
    const originalWarn = console.warn;

    beforeAll(async () => {
        // Crash on warn/error, so the tests go red
        console.error = (...args) => {
            originalError(...args);
            if (!allowConsoleError) {
                throw new Error(
                    `Console error was called. We forbid console.error in these tests. : ${args.join(', ')}`
                );
            }
        };
        console.warn = (...args) => {
            originalWarn(...args);
            if (!allowConsoleWarn) {
                throw new Error(
                    `Console warning was called: We forbid console.warn in these tests.  ${args.join(', ')}`
                );
            }
        };
    });

    afterAll(() => {
        console.error = originalError;
        console.warn = originalWarn;
    });

    beforeEach(async () => {
        mockDb = new MockDatabase();
        mockErrorHandler = new MockErrorHandler();
        server = setupServer(...createHandlers(mockDb, mockErrorHandler));
        server.listen();
        allowConsoleError = false;
        allowConsoleWarn = false;
    });

    afterEach(async () => {
        server.close();
    });

    describe('Persistence of spaces, conversations and messages', () => {
        it('should create a space and persist it to both Redux and IndexedDB', async () => {
            const { store, dispatch, dbApi } = await setupTestEnvironment();
            try {
                // Create a test space
                console.log('Create a test space');
                const spaceId = newSpaceId();
                const now = new Date().toISOString();
                const testSpace: Space = {
                    id: spaceId,
                    createdAt: now,
                    updatedAt: now,
                    spaceKey: generateSpaceKeyBase64(),
                };

                // Dispatch action to create space
                console.log('Dispatch action to create space');
                dispatch(addSpace(testSpace));
                dispatch(pushSpaceRequest({ id: testSpace.id }));

                // Verify the space was added to Redux store
                console.log('Verify the space was added to Redux store');
                const state = store.getState();
                expect(state.spaces[testSpace.id]).toEqual(testSpace);

                // Verify the space was added to IndexedDB
                console.log('Verify the space was added to IndexedDB');
                const persistedSpace = await waitForValue(async () => {
                    console.log(
                        `waiting for test space ${testSpace.id} to appear, idb spaces = `,
                        await dbApi.getAllSpaces()
                    );
                    return dbApi.getSpaceById(testSpace.id);
                });

                // Verify the space was persisted to IndexedDB correctly
                console.log('Verify the space was persisted to IndexedDB correctly');
                expect(persistedSpace).toBeDefined();
                expect(persistedSpace.id).toBe(testSpace.id);
                expect(persistedSpace.createdAt).toBe(testSpace.createdAt);
                expect(persistedSpace.wrappedSpaceKey).toBeDefined();
            } finally {
                dispatch(stopRootSaga());
            }
        });

        it('should sync space changes through service worker', async () => {
            const { dispatch, dbApi } = await setupTestEnvironment();
            try {
                // Create initial test space
                console.log('Create initial test space');
                const spaceId = newSpaceId();
                const now = new Date().toISOString();
                const space: Space = {
                    id: spaceId,
                    createdAt: now,
                    updatedAt: now,
                    spaceKey: generateSpaceKeyBase64(),
                };

                // Add space to Redux store
                console.log('Add space to Redux store');
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: spaceId }));

                const spy = jest.spyOn(LumoApi.prototype, 'postSpace');
                expect(spy).not.toHaveBeenCalled();

                // Wait for persistence to IndexedDB and server
                console.log('Wait for persistence to IndexedDB and server');
                await waitForCondition(async () => {
                    const space = await dbApi.getSpaceById(spaceId);
                    console.log('in waitForValue: space =', space);
                    const remoteId = await dbApi.getRemoteIdFromLocalId('space', spaceId);
                    console.log('in waitForValue: remoteId =', remoteId);
                    return !space?.dirty && remoteId !== undefined;
                });

                // Verify the local object has a remote id mapping
                console.log('Verify the local object has a remote id mapping');
                const remoteId = await dbApi.getRemoteIdFromLocalId('space', spaceId);
                expect(remoteId).toBeDefined();

                // Verify the API endpoint was called
                console.log('Verify the API endpoint was called');
                expect(spy).toHaveBeenCalled();
            } finally {
                dispatch(stopRootSaga());
            }
        }, 20000);

        // fixme this test fails; unsure why
        it('should automatically load data from server on app initialization', async () => {
            const masterKeyBase64 = generateMasterKeyBase64();
            const masterKey = await base64ToMasterKey(masterKeyBase64);
            const userId = generateFakeUserId();

            // First, create some test data on the server
            console.log('Creating test data on server');
            const testSpaces = await generateTestSpacesOnMockServer(3, masterKey, mockDb);

            // For each space, create a conversation and a message
            console.log('Creating conversations and messages on server');
            const testData = {
                spaces: testSpaces,
                conversations: [] as any[],
                messages: [] as any[],
            };

            for (const space of testSpaces) {
                const spaceDek = await getSpaceDek(space);
                const conversation = createTestConversation(space.id, { title: `Test Conversation for ${space.id}` });
                const message = createTestMessage(conversation.id, Role.User, {
                    content: `Test message for conversation ${conversation.id}`,
                    status: 'succeeded' as Status,
                });

                // Serialize and add to mock server
                const serializedSpace = await serializeSpace(space, masterKey);
                const serializedConversation = await serializeConversation(conversation, spaceDek);
                const serializedMessage = await serializeMessage(message, spaceDek);
                if (!serializedConversation || !serializedMessage) throw new Error('Failed to serialize');

                const remoteSpaceId = space.remoteId;
                const remoteConversationId = await mockDb.getNextConversationId();
                const remoteMessageId = await mockDb.getNextMessageId();

                expect(serializedSpace.wrappedSpaceKey).toBeDefined();
                expect(serializedSpace.encrypted).toBeDefined();
                expect(typeof serializedSpace.encrypted).toBe('string');
                expect(serializedConversation.encrypted).toBeDefined();
                expect(typeof serializedMessage.encrypted).toBe('string');
                expect(serializedMessage.encrypted).toBeDefined();
                expect(typeof serializedMessage.encrypted).toBe('string');

                // already added by generateTestSpacesOnMockServer()
                // mockDb.addSpace({
                //     ID: remoteSpaceId,
                //     CreateTime: space.createdAt,
                //     SpaceKey: serializedSpace.wrappedSpaceKey!,
                //     SpaceTag: space.id,
                //     Encrypted: serializedSpace.encrypted! as Base64,
                // });

                mockDb.addConversation({
                    ID: remoteConversationId,
                    CreateTime: conversation.createdAt,
                    SpaceID: remoteSpaceId,
                    ConversationTag: conversation.id,
                    Encrypted: serializedConversation.encrypted! as Base64,
                    IsStarred: false,
                });

                mockDb.addMessage({
                    ID: remoteMessageId,
                    CreateTime: message.createdAt,
                    ConversationID: remoteConversationId,
                    MessageTag: message.id,
                    Encrypted: serializedMessage.encrypted! as Base64,
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                });

                testData.conversations.push(conversation);
                testData.messages.push(message);
            }

            // Now start a fresh app instance
            console.log('Starting fresh app instance');
            const { store, dbApi, dispatch, select } = await setupTestEnvironment({
                masterKeyBase64,
                existingUserId: userId,
            });

            try {
                // Wait for spaces to be loaded from server
                console.log('Waiting for spaces to be loaded from server');
                await waitForCondition(
                    async () => {
                        const state = store.getState();
                        return Object.keys(state.spaces).length === testSpaces.length;
                    },
                    { message: 'Waiting for spaces to be loaded from server' }
                );

                // Verify spaces in Redux
                console.log('Verifying spaces in Redux');
                const state = store.getState();
                for (const space of testSpaces) {
                    const reduxSpace = state.spaces[space.id];
                    expect(reduxSpace).toBeDefined();
                    expect(reduxSpace.id).toBe(space.id);
                    expect(reduxSpace.createdAt).toBe(space.createdAt);
                }

                // Verify spaces in IndexedDB
                console.log('Verifying spaces in IndexedDB');
                const idbSpaces = await dbApi.getAllSpaces();
                expect(idbSpaces.length).toBe(testSpaces.length);
                for (const space of testSpaces) {
                    const idbSpace = idbSpaces.find((s) => s.id === space.id);
                    expect(idbSpace).toBeDefined();
                    expect(idbSpace!.id).toBe(space.id);
                    expect(idbSpace!.createdAt).toBe(space.createdAt);
                }

                // Verify conversations in Redux
                console.log('Verifying conversations in Redux');
                for (const conversation of testData.conversations) {
                    const reduxConversation = await waitForValue(
                        async () => select(selectConversationById(conversation.id)),
                        { message: 'Waiting for conversation to be loaded from server' }
                    );
                    expect(reduxConversation).toBeDefined();
                    expect(reduxConversation.id).toBe(conversation.id);
                    expect(reduxConversation.spaceId).toBe(conversation.spaceId);
                    expect(reduxConversation.title).toBe(conversation.title);
                }

                // Verify conversations in IndexedDB
                console.log('Verifying conversations in IndexedDB');
                const idbConversations = await dbApi.getAllConversations();
                expect(idbConversations.length).toBe(testData.conversations.length);
                for (const conversation of testData.conversations) {
                    const idbConversation = idbConversations.find((c) => c.id === conversation.id);
                    expect(idbConversation).toBeDefined();
                    expect(idbConversation!.id).toBe(conversation.id);
                    expect(idbConversation!.spaceId).toBe(conversation.spaceId);
                }

                // Verify messages in Redux and IDB: should be empty since they're pulled lazily from server
                // when we navigate to a conversation
                console.log('Verifying messages in Redux');
                expect(state.messages).toStrictEqual(EMPTY_MESSAGE_MAP);
                expect((await dbApi.getAllMessages()).length).toBe(0);

                // Verify remote ID mappings exist
                console.log('Verifying remote ID mappings');
                for (const space of testSpaces) {
                    const remoteId = await dbApi.getRemoteIdFromLocalId('space', space.id);
                    expect(remoteId).toBeDefined();
                }
                for (const conversation of testData.conversations) {
                    const remoteId = await dbApi.getRemoteIdFromLocalId('conversation', conversation.id);
                    expect(remoteId).toBeDefined();
                }

                // Now fetch a conversation
                const conversationId = mapIds(state.conversations)[0];
                expect(conversationId).toBeDefined();
                const reduxConversation = state.conversations[conversationId];
                expect(reduxConversation).toBeDefined();
                dispatch(pullConversationRequest({ id: conversationId }));

                // Wait for shallow messages (for one conversation) to be loaded from server.
                // They come from the GET conversation call. They don't include the full content.
                console.log('Waiting for shallow messages (for one conversation) to be loaded from server');
                const testSubMessages = testData.messages.filter((m: Message) => m.conversationId === conversationId);
                expect(testSubMessages.length).toBeGreaterThan(0);
                await waitForCondition(
                    async () =>
                        mapLength(select(selectMessagesByConversationId(conversationId))) === testSubMessages.length,
                    { message: 'Waiting for shallow messages (for one conversation) to be loaded from server' }
                );

                // Wait for full messages (for one conversation) to be loaded from server.
                // They come from individual GET message calls. They will include the full content.
                console.log('Wait for full messages (for one conversation) to be loaded from server');
                await waitForCondition(
                    async () =>
                        listify(select(selectMessagesByConversationId(conversationId))).every(
                            (m) => m.content !== undefined
                        ),
                    { message: 'Wait for full messages (for one conversation) to be loaded from server' }
                );

                // Verify messages in Redux
                console.log('Verifying messages in Redux');
                for (const message of testSubMessages) {
                    const reduxMessage = select(selectMessageById(message.id))!;
                    expect(reduxMessage).toBeDefined();
                    expect(reduxMessage.id).toBe(message.id);
                    expect(reduxMessage.conversationId).toBe(message.conversationId);
                    expect(reduxMessage.content).toBe(message.content);
                    expect(reduxMessage.role).toBe(Role.User);
                    expect(reduxMessage.status).toBe('succeeded');
                }

                // Verify messages in IndexedDB
                console.log('Verifying messages in IndexedDB');
                const idbMessages = await dbApi.getAllMessages();
                expect(idbMessages.length).toBe(testSubMessages.length);
                for (const message of testSubMessages) {
                    const idbMessage = idbMessages.find((m) => m.id === message.id);
                    expect(idbMessage).toBeDefined();
                    expect(idbMessage!.id).toBe(message.id);
                    expect(idbMessage!.conversationId).toBe(message.conversationId);
                }

                // Verify remote ID mappings exist
                console.log('Verify remote ID mappings exist');
                for (const message of testSubMessages) {
                    const remoteId = await dbApi.getRemoteIdFromLocalId('message', message.id);
                    expect(remoteId).toBeDefined();
                }
            } finally {
                dispatch(stopRootSaga());
            }
        }, 20000);

        it('should handle complete conversation flow and save to IndexedDB (no server-side persistence)', async () => {
            const { store, dispatch, dbApi } = await setupTestEnvironment({
                // withPersistence: false,
            });

            try {
                // Create space
                console.log('Create space');
                const spaceId = newSpaceId();
                const space = createTestSpace({ id: spaceId });
                const spaceDek = await getSpaceDek(space);
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: spaceId }));

                // Create conversation
                console.log('Create conversation');
                const conversationId = newConversationId();
                const now = new Date().toISOString();
                const conversation = {
                    id: conversationId,
                    spaceId,
                    createdAt: now,
                    updatedAt: now,
                    title: '',
                    status: ConversationStatus.COMPLETED,
                };
                dispatch(addConversation(conversation));
                dispatch(pushConversationRequest({ id: conversationId }));

                // Create question message
                console.log('Create question message');
                const questionMessageId = newMessageId();
                const questionMessage: MessagePub = {
                    id: questionMessageId,
                    conversationId,
                    createdAt: new Date().toISOString(),
                    role: Role.User,
                    status: 'succeeded' as Status,
                };
                dispatch(addMessage(questionMessage));
                dispatch(
                    finishMessage({
                        messageId: questionMessageId,
                        conversationId,
                        spaceId,
                        content: 'Test question',
                        status: 'succeeded' as Status,
                        role: Role.User,
                    })
                );
                dispatch(pushMessageRequest({ id: questionMessageId }));

                // Create answer message (unfinished initially)
                console.log('Create answer message (unfinished initially)');
                const answerMessageId = newMessageId();
                const answerMessage: MessagePub = {
                    id: answerMessageId,
                    conversationId,
                    createdAt: new Date().toISOString(),
                    role: Role.Assistant,
                    status: 'pending' as Status,
                    placeholder: true,
                };
                dispatch(addMessage(answerMessage));

                // Wait for initial save to IndexedDB: space, conversation, question
                console.log('Wait for initial save to IndexedDB: space, conversation, question');
                const savedSpace = await waitForValue(() => dbApi.getSpaceById(spaceId));
                expect(savedSpace).toBeDefined();
                expect(savedSpace.id).toBe(spaceId);
                const savedConversation1 = await waitForValue(() => dbApi.getConversationById(conversationId));
                expect(savedConversation1).toBeDefined();
                expect(savedConversation1.id).toBe(conversationId);
                const savedQuestionMessage = await waitForValue(() => dbApi.getMessageById(questionMessageId));
                expect(savedQuestionMessage).toBeDefined();
                expect(savedQuestionMessage.status).toBe('succeeded');
                const decryptedSavedQuestionMessage = await deserializeMessage(savedQuestionMessage, spaceDek);
                expect(decryptedSavedQuestionMessage).toBeDefined();
                expect(decryptedSavedQuestionMessage!.content).toBe('Test question');

                // Verify the answer message exists in Redux before finishing it
                console.log('Verify the answer message exists in Redux before finishing it');
                const state2 = store.getState();
                expect(state2.messages[answerMessageId]).toBeDefined();

                // Simulate receiving token data and finishing the answer message
                console.log('Simulate receiving token data and finishing the answer message');
                type G = GenerationResponseMessage;
                const sseMessages: G[] = [
                    { type: 'queued' },
                    { type: 'queued' },
                    { type: 'ingesting', target: 'title' },
                    { type: 'token_data', target: 'title', content: 'Example', count: 0 },
                    { type: 'token_data', target: 'title', content: ' Title', count: 1 },
                    { type: 'ingesting', target: 'message' },
                    { type: 'token_data', target: 'message', content: 'This', count: 0 },
                    { type: 'token_data', target: 'message', content: ' is', count: 1 },
                    { type: 'token_data', target: 'message', content: ' an', count: 2 },
                    { type: 'token_data', target: 'message', content: ' example', count: 3 },
                    { type: 'token_data', target: 'message', content: ' message', count: 4 },
                    { type: 'token_data', target: 'message', content: '.', count: 5 },
                    { type: 'done' },
                ];
                // FIXME getCallbacks is no longer the real function!
                const { chunkCallback, finishCallback } = _getCallbacks(spaceId, conversationId, answerMessageId);
                for (const sse of sseMessages) {
                    await chunkCallback(sse, dispatch);
                    await sleep(50);
                }
                await finishCallback('succeeded', dispatch);

                // Check that in Redux, message/conversation have the correct content/title
                console.log('Check that in Redux, message/conversation have the correct content/title');
                expect(store.getState().messages[answerMessageId].content === 'This is an example message.');
                expect(store.getState().conversations[conversationId].title === 'Example Title');

                // Check that the message saved in IndexedDB has the correct content
                console.log('Check that the message saved in IndexedDB has the correct content');
                const savedAnswerMessage = await waitForValue(async () => {
                    const msg = await dbApi.getMessageById(answerMessageId);
                    return msg?.status === 'succeeded' ? msg : undefined;
                });
                expect(savedAnswerMessage).toBeDefined();
                expect(savedAnswerMessage.status).toBe('succeeded');
                const decryptedSavedAnswerMessage = await deserializeMessage(savedAnswerMessage, spaceDek);
                expect(decryptedSavedAnswerMessage).toBeDefined();
                expect(decryptedSavedAnswerMessage!.content).toBe('This is an example message.');

                // Check the saved conversation in IndexedDB has the correct title
                console.log('Check the saved conversation in IndexedDB has the correct title');
                const savedConversation2 = await waitForValue(() => dbApi.getConversationById(conversationId));
                const decryptedSavedConversation = await deserializeConversation(savedConversation2, spaceDek);
                expect(decryptedSavedConversation).toBeDefined();
                expect(decryptedSavedConversation!.title).toBe('Example Title');
            } finally {
                dispatch(stopRootSaga());
            }
        }, 10000);

        it('should handle space deletion with server-side persistence', async () => {
            const { store, dispatch, dbApi, lumoApi } = await setupTestEnvironment();

            try {
                // Create space
                console.log('Create space');
                const spaceId = newSpaceId();
                const space = createTestSpace({ id: spaceId });
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: spaceId }));

                // Wait for initial save to IndexedDB
                console.log('Wait for initial save to IndexedDB');
                console.log(`calling dbApi.getSpaceById(spaceId=${spaceId})`);
                const persistedSpace = await waitForValue(() => dbApi.getSpaceById(spaceId));
                console.log(`called dbApi.getSpaceById(spaceId=${spaceId}) -> `, persistedSpace);
                expect(persistedSpace).toBeDefined();
                expect(persistedSpace.id).toBe(spaceId);

                // Wait for the space dirty flag to become falsy in IDB, indicating synchronization
                console.log('Wait for the space dirty flag to become falsy in IDB, indicating synchronization');
                await waitForCondition(async () => {
                    const space = await dbApi.getSpaceById(spaceId);
                    if (space && !space.dirty) return true;
                    return false;
                });

                // Wait for the space to appear in the remote list
                console.log('Wait for the space to appear in the remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    console.log('listSpaces:', result);
                    return result.spaces[spaceId] !== undefined;
                });

                // Verify the space is in Redux
                console.log('Verify the space is in Redux');
                const state0 = store.getState();
                expect(state0.spaces[spaceId]).toBeDefined();

                // Delete the space
                console.log('Delete the space');
                dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
                await sleep(1000); // tbr -- if this works, then 2nd call races the 1st
                dispatch(pushSpaceRequest({ id: spaceId }));

                // Verify the space is now removed from Redux
                console.log('Verify the space is now removed from Redux');
                const state1 = store.getState();
                expect(state1.spaces[spaceId]).toBeUndefined();

                // Wait for the deletion to be processed by IndexedDB
                console.log('Wait for the deletion to be processed by IndexedDB');
                const deletedSpace = await waitForValue(async () => {
                    const space = await dbApi.getSpaceById(spaceId);
                    if (!space) throw new Error('space should not be hard deleted');
                    return space.deleted ? space : undefined;
                });

                // Verify that the space is marked as deleted in IndexedDB and wrappedSpaceKey is undefined
                console.log('Verify that the space is marked as deleted in IndexedDB and wrappedSpaceKey is undefined');
                expect(deletedSpace).toBeDefined();
                expect(deletedSpace.deleted).toBe(true);
                expect(deletedSpace.wrappedSpaceKey).toBeUndefined();

                // Wait for the space dirty flag to become falsy in IDB, indicating synchronization
                console.log('Wait for the space dirty flag to become falsy in IDB, indicating synchronization');
                await waitForCondition(
                    async () => {
                        const space = await dbApi.getSpaceById(spaceId);
                        if (!space) throw new Error('space should not be hard deleted');
                        return !space.dirty;
                    },
                    { pollInterval: 1000 }
                );

                // Wait for the deleted space to appear in the remote list
                console.log('Wait for the deleted space to appear in the remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    return result.deletedSpaces[spaceId] !== undefined;
                });

                // Refresh spaces from remote to verify deletion is synced
                console.log('Refresh spaces from remote to verify deletion is synced');
                dispatch(pullSpacesRequest());

                // Check the space is deleted:true in IndexedDB and wrappedSpaceKey is undefined
                console.log('Check the space is deleted:true in IndexedDB and wrappedSpaceKey is undefined');
                const finalSpace = await dbApi.getSpaceById(spaceId);
                expect(finalSpace).toBeDefined();
                expect(finalSpace!.deleted).toBe(true);
                expect(finalSpace!.wrappedSpaceKey).toBeUndefined();

                // Verify the space is not loaded into Redux when loading from IndexedDB
                console.log('Verify the space is not loaded into Redux when loading from IndexedDB');
                dispatch(reloadReduxRequest());
                await sleep(500); // hack
                const stateAfterFinalReload = store.getState();
                expect(stateAfterFinalReload.spaces[spaceId]).toBeUndefined();

                // Verify the space is still removed from Redux store after remote refresh
                console.log('Verify the space is still removed from Redux store after remote refresh');
                const state2 = store.getState();
                expect(state2.spaces[spaceId]).toBeUndefined();
            } finally {
                dispatch(stopRootSaga());
            }
        }, 20000);

        it('should handle complex space deletion with multiple conversations and messages', async () => {
            const { store, dispatch, dbApi, lumoApi } = await setupTestEnvironment();

            try {
                // Create test data structure
                console.log('Create test data structure');
                const testData = createTestData();

                // Add test data to store
                console.log('Add test data to store');
                await dispatch(addTestDataToStore(testData));

                // Verify initial state in Redux
                console.log('Verify initial state in Redux');
                const initialState = store.getState();
                for (const space of testData.spaces) {
                    expect(initialState.spaces[space.id]).toBeDefined();
                }
                for (const conversation of testData.conversations) {
                    expect(initialState.conversations[conversation.id]).toBeDefined();
                }
                for (const message of testData.messages) {
                    expect(initialState.messages[message.id]).toBeDefined();
                }

                // Wait for all spaces to be saved to IndexedDB
                console.log('Wait for all spaces to be saved to IndexedDB');
                for (const space of testData.spaces) {
                    const persistedSpace = await waitForValue(() => dbApi.getSpaceById(space.id));
                    expect(persistedSpace).toBeDefined();
                    expect(persistedSpace.id).toBe(space.id);
                }

                // Wait for all spaces to sync with server
                console.log('Wait for all spaces to sync with server');
                for (const space of testData.spaces) {
                    await waitForSpaceSyncWithServer(dbApi, space.id);
                }

                // Wait for spaces to appear in remote list
                console.log('Wait for spaces to appear in remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    return testData.spaces.every((space) => result.spaces[space.id] !== undefined);
                });

                // Refresh spaces from remote to verify sync
                console.log('Refresh spaces from remote to verify sync');
                dispatch(pullSpacesRequest());
                await sleep(1000);
                // todo: waitForCondition of the next block instead

                await waitForCondition(async () => {
                    const stateAfterSync = store.getState();
                    for (const space of testData.spaces) {
                        if (!stateAfterSync.spaces[space.id]) {
                            console.log(
                                `waiting for all spaces to be deleted from redux: space ${space.id} is not yet deleted`
                            );
                            return false;
                        }
                    }
                    console.log(`waiting for all spaces to be deleted from redux: all test spaces are deleted`);
                    return true;
                });

                // Verify all spaces are in Redux
                console.log('Verify all spaces are in Redux');
                const stateAfterSync = store.getState();
                for (const space of testData.spaces) {
                    expect(stateAfterSync.spaces[space.id]).toBeDefined();
                }

                // Delete the first space
                console.log('Delete the first space');
                const spaceToDelete = testData.spaces[0];
                dispatch(locallyDeleteSpaceFromLocalRequest(spaceToDelete.id));
                await sleep(1000); // tbr - this doesn't guarantee good behavior since we don't to this in prod code
                dispatch(pushSpaceRequest({ id: spaceToDelete.id }));

                // Verify the space is removed from Redux
                console.log('Verify the space is removed from Redux');
                const stateAfterDeletion = store.getState();
                expect(stateAfterDeletion.spaces[spaceToDelete.id]).toBeUndefined();

                // Wait for the deletion to be processed by IndexedDB
                console.log('Wait for the deletion to be processed by IndexedDB');
                await waitForCondition(async () => {
                    const space = await dbApi.getSpaceById(spaceToDelete.id);
                    return space?.deleted === true;
                });

                // Verify that the space is marked as deleted in IndexedDB and wrappedSpaceKey is undefined
                console.log('Verify that the space is marked as deleted in IndexedDB and wrappedSpaceKey is undefined');
                const deletedSpace = await dbApi.getSpaceById(spaceToDelete.id);
                expect(deletedSpace).toBeDefined();
                expect(deletedSpace!.deleted).toBe(true);
                expect(deletedSpace!.wrappedSpaceKey).toBeUndefined();

                // Wait for the space dirty flag to become falsy in IDB
                console.log('Wait for the space dirty flag to become falsy in IDB');
                await waitForCondition(
                    async () => {
                        const space = await dbApi.getSpaceById(spaceToDelete.id);
                        if (!space) throw new Error('space should not be hard deleted');
                        return !space.dirty;
                    },
                    { pollInterval: 1000 }
                );

                // Wait for the deleted space to appear in remote list
                console.log('Wait for the deleted space to appear in remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    return result.deletedSpaces[spaceToDelete.id] !== undefined;
                });

                // Refresh spaces from remote to verify deletion is synced
                console.log('Refresh spaces from remote to verify deletion is synced');
                dispatch(pullSpacesRequest());
                await sleep(1000);

                // Check the space is deleted:true in IndexedDB and wrappedSpaceKey is undefined
                console.log('Check the space is deleted:true in IndexedDB and wrappedSpaceKey is undefined');
                const finalSpace = await dbApi.getSpaceById(spaceToDelete.id);
                expect(finalSpace).toBeDefined();
                expect(finalSpace!.deleted).toBe(true);
                expect(finalSpace!.wrappedSpaceKey).toBeUndefined();

                // Verify the space is not loaded into Redux when loading from IndexedDB
                console.log('Verify the space is not loaded into Redux when loading from IndexedDB');
                // await dispatch(unloadReduxState);
                // await dispatch(loadReduxStateFromIndexedDb(dbApi, masterKey));
                dispatch(reloadReduxRequest());
                await sleep(500);
                const stateAfterFinalReload = store.getState();
                expect(stateAfterFinalReload.spaces[spaceToDelete.id]).toBeUndefined();

                // Verify only the deleted space is removed from Redux
                console.log('Verify only the deleted space is removed from Redux');
                const finalState = store.getState();
                expect(finalState.spaces[spaceToDelete.id]).toBeUndefined();

                // Verify conversations and messages from deleted space are gone
                console.log('Verify conversations and messages from deleted space are gone');
                const deletedSpaceConversations = testData.conversations.filter((c) => c.spaceId === spaceToDelete.id);
                for (const conversation of deletedSpaceConversations) {
                    expect(finalState.conversations[conversation.id]).toBeUndefined();
                    const conversationMessages = testData.messages.filter((m) => m.conversationId === conversation.id);
                    for (const message of conversationMessages) {
                        expect(finalState.messages[message.id]).toBeUndefined();
                    }
                }

                // Verify conversations and messages from other spaces still exist
                console.log('Verify conversations and messages from other spaces still exist');
                const otherSpaceConversations = testData.conversations.filter((c) => c.spaceId !== spaceToDelete.id);
                for (const conversation of otherSpaceConversations) {
                    expect(finalState.conversations[conversation.id]).toBeDefined();
                    const conversationMessages = testData.messages.filter((m) => m.conversationId === conversation.id);
                    for (const message of conversationMessages) {
                        expect(finalState.messages[message.id]).toBeDefined();
                    }
                }
            } finally {
                dispatch(stopRootSaga());
            }
        }, 30000);

        it('should load the state from indexeddb', async () => {
            const masterKeyBytes = fixedMasterKeyBytes();
            const masterKeyBase64 = masterKeyBytes.toBase64();
            const sharedUserId = generateFakeUserId();
            const sharedDbApi = new DbApi(sharedUserId);
            await sharedDbApi.initialize();

            // Create some test data
            console.log('Create some test data');
            // - space
            console.log('- space');
            const spaceId = newSpaceId();
            const space = createTestSpace({ id: spaceId });
            const spaceDek = await getSpaceDek(space);
            // - conversation
            console.log('- conversation');
            const conversationId = newConversationId();
            const now = new Date().toISOString();
            const conversation = {
                id: conversationId,
                spaceId,
                createdAt: now,
                updatedAt: now,
                title: 'Test Conversation',
                status: ConversationStatus.COMPLETED,
            };
            // - message
            console.log('- message');
            const messageId = newMessageId();
            const message = {
                id: messageId,
                conversationId,
                createdAt: new Date().toISOString(),
                role: Role.User,
                status: 'succeeded' as Status,
                content: 'Test message content',
            } satisfies Message & { content: string; status: Status };

            // Pretend this is a first tab
            {
                const { store, dbApi, masterKey, dispatch } = await setupTestEnvironment({
                    masterKeyBase64,
                    // withPersistence: false,
                    existingUserId: sharedUserId,
                    existingDbApi: sharedDbApi,
                });
                try {
                    // Add to Redux store
                    console.log('Add to Redux store');
                    dispatch(addSpace(space));
                    dispatch(pushSpaceRequest({ id: spaceId }));
                    dispatch(addConversation(conversation));
                    dispatch(pushConversationRequest({ id: conversationId }));
                    dispatch(addMessage(message));
                    dispatch(pushMessageRequest({ id: messageId }));

                    // Verify data is in Redux
                    console.log('Verify data is in Redux');
                    const initialState = store.getState();
                    expect(initialState.spaces[spaceId]).toBeDefined();
                    expect(initialState.conversations[conversationId]).toBeDefined();
                    expect(initialState.messages[messageId]).toBeDefined();

                    // Wait for save to IndexedDB
                    console.log('Wait for save to IndexedDB');
                    const idbSpace1 = await waitForValue(() => dbApi.getSpaceById(spaceId));
                    const idbConversation1 = await waitForValue(() => dbApi.getConversationById(conversationId));
                    const idbMessage1 = await waitForValue(() => dbApi.getMessageById(messageId));
                    const idbAllSpaces1 = await waitForValue(() => dbApi.getAllSpaces());
                    const idbAllConversations1 = await waitForValue(() => dbApi.getAllConversations());
                    const idbAllMessages1 = await waitForValue(() => dbApi.getAllMessages());

                    // Verify the data that was saved to IndexedDB
                    console.log('Verify the data that was saved to IndexedDB');
                    expect(idbAllSpaces1.map((s) => s.id)).toStrictEqual([spaceId]);
                    expect(idbAllConversations1.map((c) => c.id)).toStrictEqual([conversationId]);
                    expect(idbAllMessages1.map((m) => m.id)).toStrictEqual([messageId]);
                    expect(idbSpace1).toBeDefined();
                    expect(idbConversation1).toBeDefined();
                    expect(idbMessage1).toBeDefined();

                    // Jsonify the IDB state into a flat string that we can load in the next test, look for `jsonB64`
                    console.log(
                        'Jsonify the IDB state into a flat string that we can load in the next test, look for `jsonB64`'
                    );
                    const fullState = {
                        spaces: idbAllSpaces1,
                        conversations: idbAllConversations1,
                        messages: idbAllMessages1,
                    };
                    const jsonStr = JSON.stringify(fullState);
                    const jsonB64 = btoa(jsonStr);
                    console.log('Full state:', jsonB64); // Dump it to the console so we can copy-paste it
                    const fullState2 = JSON.parse(atob(jsonB64));
                    expect(clarify(fullState2)).toStrictEqual(clarify(fullState)); // Check reloading the state works

                    // Verify data currently stored in IndexedDB matches the original when decrypted
                    console.log('Verify data currently stored in IndexedDB matches the original when decrypted');

                    // - space
                    console.log('- space');
                    const decryptedSpace1 = await deserializeSpace(idbSpace1, masterKey);
                    expect(decryptedSpace1!).toBeDefined();
                    expect(decryptedSpace1!.id).toBe(space.id);
                    expectSpaceEqual(decryptedSpace1!, space, { ignoreFields: ['createdAt'] });

                    // - conversation
                    console.log('- conversation');
                    const decryptedConversation1 = await deserializeConversation(idbConversation1, spaceDek);
                    expect(decryptedConversation1).toBeDefined();
                    expect(decryptedConversation1!.title).toBe(conversation.title);
                    expectConversationEqual(decryptedConversation1!, conversation, { ignoreFields: ['createdAt'] });

                    // - message
                    console.log('- message');
                    const decryptedMessage1 = await deserializeMessage(idbMessage1, spaceDek);
                    expect(decryptedMessage1).toBeDefined();
                    expect(decryptedMessage1!.content).toBe(message.content);
                    expectMessageEqual(decryptedMessage1!, message, { ignoreFields: ['createdAt'] });
                } finally {
                    dispatch(stopRootSaga());
                }
            }

            // Pretend this is a new browser tab.
            // This is achieved by creating a new test environment (so, starts a new Redux state and runs a new
            // rootSaga) but keeping the same IndexedDB content (by reusing the same DbApi instance).
            {
                // Setup
                const { store, dispatch } = await setupTestEnvironment({
                    masterKeyBase64,
                    // withPersistence: false,
                    existingUserId: sharedUserId,
                    existingDbApi: sharedDbApi, // keep IndexedDB as in the first tab
                });

                try {
                    // Wait a bit for rehydration from IDB to Redux
                    await sleep(1000);
                    // todo we could remove the sleep and replace the below block with several waitForValue calls

                    // Verify restored state matches original
                    console.log('Verify restored state matches original');
                    // - space
                    console.log('- space');
                    const restoredState = store.getState();
                    const restoredSpace = restoredState.spaces[spaceId];
                    expect(restoredSpace).toBeDefined();
                    expect(restoredSpace.id).toBe(spaceId);
                    expectSpaceEqual(restoredSpace, space, { ignoreFields: ['createdAt', 'updatedAt'] });
                    // - conversation
                    console.log('- conversation');
                    const restoredConversation = restoredState.conversations[conversationId];
                    expect(restoredConversation).toBeDefined();
                    expect(restoredConversation.id).toBe(conversationId);
                    expect(restoredConversation.title).toBe(conversation.title);
                    expectConversationEqual(restoredConversation, conversation, {
                        ignoreFields: ['createdAt', 'updatedAt'],
                    });
                    // - message
                    console.log('- message');
                    const restoredMessage = restoredState.messages[messageId];
                    expect(restoredMessage).toBeDefined();
                    expect(restoredMessage.id).toBe(messageId);
                    expect(restoredMessage.content).toBe(message.content);
                    expectMessageEqual(restoredMessage, message, { ignoreFields: ['createdAt'] });
                } finally {
                    dispatch(stopRootSaga());
                }
            }
        }, 20000);

        it('should load state from a previous version from indexeddb', async () => {
            // This string was generated in the previous test, check the block "Jsonify the IDB state"
            const jsonB64 = `
                eyJzcGFjZXMiOlt7ImlkIjoiNzBmYTA0YjUtZDdlMC00NWRiLTg3MTYtYjE4NWM2MTFhNzg2IiwiY3JlYXRlZEF0IjoiMjAyNS0
                wNS0xNFQxMDozMDowMC4yNTZaIiwid3JhcHBlZFNwYWNlS2V5IjoidjdRWW5zVC9sYk8vS011cFJGK0dnQ1NkaUtScU45Q0s0bE
                5WRXF4b1ZqMmtlVHA5ZnRFQlR3PT0iLCJlbmNyeXB0ZWQiOiJOczJVNmNXZUxMVUpIaERDOWVac1pxbDYyUm9Lb0RZb1dOMHlBb
                WMxIiwiZGlydHkiOnRydWV9XSwiY29udmVyc2F0aW9ucyI6W3siaWQiOiI1YjEyMWRhYy1lOGZhLTQxMjAtYmYxNC1iZGFhNGRk
                MjBhY2IiLCJzcGFjZUlkIjoiNzBmYTA0YjUtZDdlMC00NWRiLTg3MTYtYjE4NWM2MTFhNzg2IiwiY3JlYXRlZEF0IjoiMjAyNS0
                wNS0xNFQxMDozMDowMC4yNTZaIiwiZW5jcnlwdGVkIjoiZ0J2Sm81M3diZGVkdE80Yi9xdmsxejVLOFZNYWJsajhVT2pLcXFYRz
                c5Z3c0UEI0ZHQ5VUhTcEJpeEpsOXlYQlA3UlFLaCtZUStGRSIsImRpcnR5Ijp0cnVlfV0sIm1lc3NhZ2VzIjpbeyJpZCI6ImFjZ
                GIzODBmLTcwNTUtNDQyZi1hOWIyLTlkOTAwYzQ2ZTA1ZSIsImNyZWF0ZWRBdCI6IjIwMjUtMDUtMTRUMTA6MzA6MDAuMjU2WiIs
                InJvbGUiOiJ1c2VyIiwiY29udmVyc2F0aW9uSWQiOiI1YjEyMWRhYy1lOGZhLTQxMjAtYmYxNC1iZGFhNGRkMjBhY2IiLCJzdGF
                0dXMiOiJzdWNjZWVkZWQiLCJlbmNyeXB0ZWQiOiJYVmxFRlBjUzRlcDdJQTR3V0lBY0taQ2ZEZHlINXB5ZkZzbjZ0MGJTdXpSNj
                g2WVE2ZW5LRmR2OFNUN0tJcDBaVnJlZVRMTEc2MExMTFRPSThDWT0iLCJkaXJ0eSI6dHJ1ZX1dfQ==
            `;
            const fullState = JSON.parse(atob(jsonB64)) as {
                messages: SerializedMessage[];
                conversations: SerializedConversation[];
                spaces: SerializedSpace[];
            };

            const masterKeyBytes = fixedMasterKeyBytes();
            const masterKeyBase64 = masterKeyBytes.toBase64();
            const { store, dispatch, dbApi } = await setupTestEnvironment({
                // withPersistence: false,
                masterKeyBase64,
            });

            try {
                // Restore the state into IDB
                console.log('Restore the state into IDB');
                fullState.messages.forEach((m) => dbApi.updateMessage(m, { dirty: false }));
                fullState.conversations.forEach((c) => dbApi.updateConversation(c, { dirty: false }));
                fullState.spaces.forEach((s) => dbApi.updateSpace(s, { dirty: false }));

                // Load state into Redux
                console.log('Load state into Redux');
                dispatch(reloadReduxRequest());
                await sleep(500);

                // Check restored state
                console.log('Check restored state');
                const restoredState = store.getState();
                const { messages: messageMap, conversations: conversationMap, spaces: spaceMap } = restoredState;
                // - space
                console.log('- space');
                const spaceIds = mapIds(spaceMap);
                expect(spaceIds.length).toBe(1);
                const spaceId = spaceIds[0];
                // - conversation
                console.log('- conversation');
                const conversationIds = mapIds(conversationMap);
                expect(conversationIds.length).toBe(1);
                const conversationId = conversationIds[0];
                const conversation = conversationMap[conversationId];
                expect(conversation.title).toBe('Test Conversation');
                expect(conversation.spaceId).toBe(spaceId);
                // - message
                console.log('- message');
                const messageIds = mapIds(messageMap);
                expect(messageIds.length).toBe(1);
                const messageId = messageIds[0];
                const message = messageMap[messageId];
                expect(message.content).toBe('Test message content');
                expect(message.conversationId).toBe(conversationId);
            } finally {
                dispatch(stopRootSaga());
            }
        });

        it('should handle pagination with persistence', async () => {
            function spacesInReduxWhenMoreThan(nExpected: number) {
                return async () => {
                    const { spaces } = store.getState();
                    const nSpaces = mapLength(spaces);
                    console.log(`waiting for ${nExpected} spaces to appear, currently have`, nSpaces);
                    return nSpaces >= nExpected ? spaces : undefined;
                };
            }

            function spacesInIDBWhenMoreThan(nExpected: number) {
                return async () => {
                    const spaces = await dbApi.getAllSpaces();
                    const nSpaces = spaces.length;
                    console.log(`waiting for ${nExpected} spaces to appear, currently have`, nSpaces);
                    return nSpaces >= 150 ? mapify(spaces) : undefined;
                };
            }

            const { store, dispatch, dbApi, masterKey } = await setupTestEnvironment();

            try {
                // Generate 150 test spaces
                console.log('Generate 150 test spaces');
                const testSpaces = await generateTestSpacesOnMockServer(150, masterKey, mockDb);
                const testSpaceIds = testSpaces.map((s) => s.id);

                // Refresh from remote and wait for first 100 spaces
                console.log('Refresh from remote and wait for first 100 spaces');
                dispatch(pullSpacesRequest());

                // Wait for first 100 spaces to be loaded in IndexedDB
                console.log('Wait for first 100 spaces to be loaded in IndexedDB');
                const spaces1 = await waitForValue(spacesInReduxWhenMoreThan(100), { pollInterval: 1000 });

                // Verify first 100 spaces are in Redux
                console.log('Verify first 100 spaces are in Redux');
                expect(mapLength(spaces1)).toBeGreaterThanOrEqual(100);

                // List spaces should

                // Wait for all 150 spaces to be found in IndexedDB
                console.log('Wait for all 150 spaces to be found in IndexedDB');
                await waitForValue(spacesInIDBWhenMoreThan(150), { pollInterval: 1000 });

                // Verify all 150 spaces are loaded back in Redux
                console.log('Verify all 150 spaces are loaded back in Redux');
                const spaces2 = await waitForValue(spacesInReduxWhenMoreThan(150), { pollInterval: 1000 });
                expect(mapLength(spaces2)).toBe(150);

                // Test IDB spaces are the same as the initial test set
                console.log('Test IDB spaces are the same as the initial test set');
                const spaceIds2 = mapIds(spaces2);
                expect(setify(spaceIds2)).toStrictEqual(setify(testSpaceIds));
            } finally {
                dispatch(stopRootSaga());
            }
        }, 30000);

        it('should handle failed answer message and follow-up question persistence', async () => {
            const { dispatch, dbApi, lumoApi } = await setupTestEnvironment();

            try {
                // Create initial space
                console.log('Create initial space');
                const space = createTestSpace();
                const spaceDek = await getSpaceDek(space);
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: space.id }));

                // Create conversation
                console.log('Create conversation');
                const conversation = createTestConversation(space.id, { title: 'Test Failed Answer' });
                dispatch(addConversation(conversation));
                dispatch(pushConversationRequest({ id: conversation.id }));

                // Create initial question message
                console.log('Create initial question message');
                const questionContent = 'Initial question';
                const questionMessage = createTestMessage(conversation.id, Role.User, {
                    content: questionContent,
                    status: 'succeeded' satisfies Status,
                });
                dispatch(addMessage(questionMessage));
                dispatch(
                    finishMessage({
                        messageId: questionMessage.id,
                        conversationId: conversation.id,
                        spaceId: space.id,
                        content: questionContent,
                        status: 'succeeded' satisfies Status,
                        role: Role.User,
                    })
                );
                dispatch(pushMessageRequest({ id: questionMessage.id }));

                // Create failed answer message
                console.log('Create failed answer message');
                const failedAnswerContent = '';
                const failedAnswerMessage = createTestMessage(conversation.id, Role.Assistant, {
                    parentId: questionMessage.id,
                    content: failedAnswerContent,
                    placeholder: true,
                });
                dispatch(addMessage(failedAnswerMessage));
                dispatch(
                    finishMessage({
                        messageId: failedAnswerMessage.id,
                        conversationId: conversation.id,
                        spaceId: space.id,
                        content: failedAnswerContent,
                        status: 'failed' satisfies Status,
                        role: Role.Assistant,
                    })
                );
                dispatch(pushMessageRequest({ id: failedAnswerMessage.id }));

                // Create follow-up question message
                console.log('Create follow-up question message');
                const followUpQuestionContent = 'Follow-up question after failure';
                const followUpQuestion = createTestMessage(conversation.id, Role.User, {
                    parentId: failedAnswerMessage.id,
                    content: followUpQuestionContent,
                });
                dispatch(addMessage(followUpQuestion));
                dispatch(
                    finishMessage({
                        messageId: followUpQuestion.id,
                        conversationId: conversation.id,
                        spaceId: space.id,
                        content: followUpQuestionContent,
                        status: 'succeeded' satisfies Status,
                        role: Role.User,
                    })
                );
                dispatch(pushMessageRequest({ id: followUpQuestion.id }));

                // Wait for all messages to be saved to IndexedDB
                console.log('Wait for all messages to be saved to IndexedDB');
                const persistedQuestion = await waitForValue(() => dbApi.getMessageById(questionMessage.id));
                const persistedFailedAnswer = await waitForValue(() => dbApi.getMessageById(failedAnswerMessage.id));
                const persistedFollowUp = await waitForValue(() => dbApi.getMessageById(followUpQuestion.id));

                // Verify messages in IndexedDB
                console.log('Verify messages in IndexedDB');
                expect(persistedQuestion).toBeDefined();
                expect(persistedFailedAnswer).toBeDefined();
                expect(persistedFollowUp).toBeDefined();

                // Verify message contents after decryption
                console.log('Verify message contents after decryption');
                const decryptedQuestion = await deserializeMessage(persistedQuestion, spaceDek);
                const decryptedFailedAnswer = await deserializeMessage(persistedFailedAnswer, spaceDek);
                const decryptedFollowUp = await deserializeMessage(persistedFollowUp, spaceDek);

                expect(decryptedQuestion?.content).toBe(questionContent);
                expect(decryptedQuestion?.status).toBe('succeeded');
                expect(decryptedFailedAnswer?.content).toBe(failedAnswerContent);
                expect(decryptedFailedAnswer?.status).toBe('failed');
                expect(decryptedFollowUp?.content).toBe(followUpQuestionContent);
                expect(decryptedFollowUp?.status).toBe('succeeded');
                expect(decryptedFollowUp?.parentId).toBe(failedAnswerMessage.id);

                // Wait for space to sync with server
                console.log('Wait for space to sync with server');
                await waitForSpaceSyncWithServer(dbApi, space.id);
                await waitForConversationSyncWithServer(dbApi, conversation.id);
                await waitForMessageSyncWithServer(dbApi, questionMessage.id);
                await waitForMessageSyncWithServer(dbApi, failedAnswerMessage.id);
                await waitForMessageSyncWithServer(dbApi, followUpQuestion.id);

                // Wait for space to appear in remote list
                console.log('Wait for space to appear in remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    console.log(`waiting for space ${space.id} to appear in: `, result.spaces);
                    const remoteSpace = result.spaces[space.id];
                    return remoteSpace !== undefined;
                });
            } finally {
                dispatch(stopRootSaga());
            }
        }, 20000);

        it('should handle server errors gracefully and recover (10+ sec wait)', async () => {
            const { dispatch, dbApi, lumoApi } = await setupTestEnvironment();

            try {
                // 1. First create some data successfully
                console.log('1. First create some data successfully');
                const space = createTestSpace();
                const spaceDek = await getSpaceDek(space);
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: space.id }));

                // Wait for space to be saved to IndexedDB
                console.log('Wait for space to be saved to IndexedDB');
                const savedSpace = await waitForValue(() => dbApi.getSpaceById(space.id));
                expect(savedSpace).toBeDefined();

                // Wait for save to server
                console.log('Wait for save to server');
                await waitForSpaceSyncWithServer(dbApi, space.id);
                const remoteSpaceId = (await dbApi.getRemoteIdFromLocalId('space', space.id))!;
                expect(remoteSpaceId).toBeDefined();

                // 2. Set up 500 on space listing
                console.log('2. Set up 500 on space listing');
                allowConsoleError = true;
                let nListSpacesErrors = 0;
                mockErrorHandler.injectError('/api/lumo/v1/spaces', 'GET', 500, () => {
                    nListSpacesErrors++;
                    console.log(`Space list error triggered, count now: ${nListSpacesErrors}`);
                });

                // Attempt to refresh spaces from remote (should fail)
                console.log('Attempt to refresh spaces from remote (should fail)');
                dispatch(pullSpacesRequest());
                await sleep(500); // waitFor below

                // Verify error was triggered
                console.log('Verify error was triggered');
                expect(nListSpacesErrors).toBeGreaterThan(0);

                // 3. Clear the error and verify we can now refresh
                console.log('Clear the error and verify we can now refresh');
                mockErrorHandler.clearAllErrors();
                allowConsoleError = false;

                // Try again, should succeed
                console.log('Try again, should succeed');
                dispatch(pullSpacesRequest());

                // 4. Set up conversation creation error handling with a local counter
                console.log('4. Set up conversation creation error handling with a local counter');
                allowConsoleError = true;
                let nPostConversationErrors = 0;
                mockErrorHandler.injectError(`/api/lumo/v1/spaces/${remoteSpaceId}/conversations`, 'POST', 500, () => {
                    nPostConversationErrors++;
                    console.log(`Conversation create error triggered, count now: ${nPostConversationErrors}`);
                });

                // Create conversation (this will be successfully saved to IDB, but remote sync will fail)
                console.log('Create conversation (this will be successfully saved to IDB, but remote sync will fail)');
                const conversation = createTestConversation(space.id, { title: 'Error Test Conversation' });
                dispatch(addConversation(conversation));
                dispatch(pushConversationRequest({ id: conversation.id }));

                // Wait for conversation to be saved to IndexedDB
                console.log('Wait for conversation to be saved to IndexedDB');
                const persistedConversation = await waitForValue(() => dbApi.getConversationById(conversation.id));
                expect(persistedConversation).toBeDefined();

                // Wait for the sync attempt to happen and verify error was triggered
                console.log('Wait for the sync attempt to happen and verify error was triggered');
                await waitForCondition(
                    async () => {
                        console.log('waiting for nPostConversationErrors > 0, got:', nPostConversationErrors);
                        return nPostConversationErrors > 0;
                    },
                    {
                        pollInterval: 500,
                        timeout: 5000,
                    }
                );

                // 5. Clear the error and set up message creation error handling
                console.log('5. Clear the error and set up message creation error handling');
                mockErrorHandler.clearAllErrors();
                allowConsoleError = false;

                // Wait for service worker to try to sync again, no need to monitorSpace() here,
                console.log('Wait for service worker to try to sync again, no need to monitorSpace() here,');
                // the worker should remember the space wasn't successfully saved, and should try again automatically
                console.log(
                    "the worker should remember the space wasn't successfully saved, and should try again automatically"
                );
                await waitForConversationSyncWithServer(dbApi, conversation.id, {
                    timeout: 40000, // worker loop restarts every 30s -- maybe we want to change that in tests
                    pollInterval: 1000,
                });
                const remoteConversationId = (await dbApi.getRemoteIdFromLocalId('conversation', conversation.id))!;
                expect(remoteConversationId).toBeDefined();

                // Inject error for message creation with error tracking callback
                console.log('Inject error for message creation with error tracking callback');
                allowConsoleError = true;
                let nPostMessageErrors = 0;
                mockErrorHandler.injectError(
                    `/api/lumo/v1/conversations/${remoteConversationId}/messages`,
                    'POST',
                    500,
                    () => {
                        nPostMessageErrors++;
                        console.log(`Message create error triggered, count now: ${nPostMessageErrors}`);
                    }
                );

                // Create a message
                console.log('Create a message');
                const questionMessage = createTestMessage(conversation.id, Role.User, {
                    content: 'Will this message sync with server errors?',
                    status: 'succeeded' satisfies Status,
                });
                dispatch(addMessage(questionMessage));
                dispatch(
                    finishMessage({
                        messageId: questionMessage.id,
                        conversationId: conversation.id,
                        spaceId: space.id,
                        content: questionMessage.content!,
                        status: 'succeeded' satisfies Status,
                        role: Role.User,
                    })
                );
                dispatch(pushMessageRequest({ id: questionMessage.id }));

                // Wait for message to be saved to IndexedDB
                console.log('Wait for message to be saved to IndexedDB');
                const persistedMessage = await waitForValue(() => dbApi.getMessageById(questionMessage.id));
                expect(persistedMessage).toBeDefined();

                // Verify message contents after decryption
                console.log('Verify message contents after decryption');
                const decryptedMessage = await deserializeMessage(persistedMessage, spaceDek);
                expect(decryptedMessage?.content).toBe(questionMessage.content);

                // 6. Now allow the system to fully recover by clearing all errors
                console.log('6. Now allow the system to fully recover by clearing all errors');
                mockErrorHandler.clearAllErrors();
                allowConsoleError = false;

                // Wait for everything to sync properly
                console.log('Wait for everything to sync properly');
                await waitForSpaceSyncWithServer(dbApi, space.id);

                // Check that the conversation synced properly after error cleared
                console.log('Check that the conversation synced properly after error cleared');
                await waitForConversationSyncWithServer(dbApi, conversation.id);

                // Wait for message to sync after error cleared
                console.log('Wait for message to sync after error cleared');
                await waitForMessageSyncWithServer(dbApi, questionMessage.id);

                // 7. Verify everything was persisted to server correctly
                console.log('7. Verify everything was persisted to server correctly');
                // Wait for space to appear in remote list
                console.log('Wait for space to appear in remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    console.log(`waiting for space ${space.id} to appear in: `, result.spaces);
                    const remoteSpace = result.spaces[space.id];
                    return remoteSpace !== undefined;
                });
            } finally {
                dispatch(stopRootSaga());
            }
        }, 45000); // todo consider decreasing if we relax the retry delay of 30s

        it('should automatically sync IndexedDB data to server when persistence is enabled', async () => {
            // This test verifies that dirty data in IndexedDB automatically syncs to server
            // when persistence is enabled, without requiring explicit actions
            const { conversations, messages, spaces } = createTestData();
            const masterKeyBase64 = generateMasterKeyBase64();
            const masterKey = await base64ToMasterKey(masterKeyBase64);
            const userId = generateFakeUserId();
            const dbApi = new DbApi(userId);
            await dbApi.initialize();
            const lumoApi = new LumoApi(userId);

            // Prepare data structures for tracking
            const spaceDekMapBySpace: Record<SpaceId, AesGcmCryptoKey> = {};
            const spaceDekMapByConv: Record<ConversationId, AesGcmCryptoKey> = {};

            // Manually add all test data to IndexedDB with dirty flag
            console.log('Setting up test data in IndexedDB with dirty flags');
            for (const space of spaces) {
                const serializedSpace = await serializeSpace(space, masterKey);
                if (!serializedSpace) throw new Error('no serialized space');
                await dbApi.addSpace(serializedSpace, { dirty: true });
                spaceDekMapBySpace[space.id] = await getSpaceDek(space);
            }

            for (const conversation of conversations) {
                const spaceDek = spaceDekMapBySpace[conversation.spaceId];
                if (!spaceDek) throw new Error('no space dek');
                spaceDekMapByConv[conversation.id] = spaceDek;
                const serializedConversation = await serializeConversation(conversation, spaceDek);
                if (!serializedConversation) throw new Error('no serialized conversation');
                await dbApi.addConversation(serializedConversation, { dirty: true });
            }

            for (const message of messages) {
                const spaceDek = spaceDekMapByConv[message.conversationId];
                if (!spaceDek) throw new Error('no space dek');
                const serializedMessage = await serializeMessage(message, spaceDek);
                if (!serializedMessage) throw new Error('no serialized message');
                await dbApi.addMessage(serializedMessage, { dirty: true });
            }

            // Verify test data is in IndexedDB with dirty flags
            console.log('Verifying initial state of test data in IndexedDB');
            const initialSpaces = await dbApi.getAllSpaces();
            const initialConversations = await dbApi.getAllConversations();
            const initialMessages = await dbApi.getAllMessages();

            expect(initialSpaces.length).toBeGreaterThan(0);
            expect(initialConversations.length).toBeGreaterThan(0);
            expect(initialMessages.length).toBeGreaterThan(0);

            expect(initialSpaces.length).toBe(spaces.length);
            expect(initialConversations.length).toBe(conversations.length);
            expect(initialMessages.length).toBe(messages.length);

            // Verify all data has dirty flag set
            expect(initialSpaces.every((s) => s.dirty === true)).toBe(true);
            expect(initialConversations.every((c) => c.dirty === true)).toBe(true);
            expect(initialMessages.every((m) => m.dirty === true)).toBe(true);

            // Start the app with existing data and enable persistence
            const { dispatch } = await setupTestEnvironment({
                existingDbApi: dbApi,
                existingUserId: userId,
                masterKeyBase64,
            });

            try {
                // Wait for all spaces to sync with server
                console.log('Waiting for spaces to sync with server');
                for (const space of spaces) {
                    await waitForSpaceSyncWithServer(dbApi, space.id);
                }

                // Wait for all conversations to sync with server
                console.log('Waiting for conversations to sync with server');
                for (const conversation of conversations) {
                    await waitForConversationSyncWithServer(dbApi, conversation.id);
                }

                // Wait for all messages to sync with server
                console.log('Waiting for messages to sync with server');
                for (const message of messages) {
                    await waitForMessageSyncWithServer(dbApi, message.id);
                }

                // Verify all data in IndexedDB no longer has dirty flag
                console.log('Verifying data is no longer dirty after auto-sync');
                const syncedSpaces = await dbApi.getAllSpaces();
                const syncedConversations = await dbApi.getAllConversations();
                const syncedMessages = await dbApi.getAllMessages();

                expect(syncedSpaces.every((s) => !s.dirty)).toBe(true);
                expect(syncedConversations.every((c) => !c.dirty)).toBe(true);
                expect(syncedMessages.every((m) => !m.dirty)).toBe(true);

                // Verify all spaces have remoteIds
                console.log('Verifying all entities have remote IDs');
                for (const space of spaces) {
                    const remoteId = await dbApi.getRemoteIdFromLocalId('space', space.id);
                    expect(remoteId).toBeDefined();
                }

                for (const conversation of conversations) {
                    const remoteId = await dbApi.getRemoteIdFromLocalId('conversation', conversation.id);
                    expect(remoteId).toBeDefined();
                }

                for (const message of messages) {
                    const remoteId = await dbApi.getRemoteIdFromLocalId('message', message.id);
                    expect(remoteId).toBeDefined();
                }

                // Verify spaces are available via the API
                console.log('Verifying spaces are available via the API');
                const remoteSpaces = await lumoApi.listSpaces();
                for (const space of spaces) {
                    expect(remoteSpaces.spaces[space.id]).toBeDefined();
                }

                // Pick one space to verify its conversations and messages via remoteIds
                const testSpace = spaces[0];
                const testSpaceRemoteId = await dbApi.getRemoteIdFromLocalId('space', testSpace.id);
                if (!testSpaceRemoteId) throw new Error('No remote ID for test space');

                // Verify conversations for this space
                const spaceConversations = conversations.filter((c) => c.spaceId === testSpace.id);
                if (spaceConversations.length > 0) {
                    const testConversation = spaceConversations[0];
                    const testConversationRemoteId = await dbApi.getRemoteIdFromLocalId(
                        'conversation',
                        testConversation.id
                    );
                    if (!testConversationRemoteId) throw new Error('No remote ID for test conversation');

                    // Verify message remoteIds instead of making direct API calls
                    const conversationMessages = messages.filter((m) => m.conversationId === testConversation.id);
                    for (const message of conversationMessages) {
                        const messageRemoteId = await dbApi.getRemoteIdFromLocalId('message', message.id);
                        expect(messageRemoteId).toBeDefined();
                    }
                }
            } finally {
                dispatch(stopRootSaga());
            }
        }, 30000);

        it('should honor server-side deletion when trying to push a non-deleted item', async () => {
            // Create a fresh user ID and DB API for this test
            const userId = generateFakeUserId();
            const masterKeyBase64 = generateMasterKeyBase64();
            const masterKey = await base64ToMasterKey(masterKeyBase64);
            const dbApi = new DbApi(userId);
            await dbApi.initialize();

            // Create a test space
            console.log('Creating test space');
            const testSpace = createTestSpace();

            // Add the space to IndexedDB with dirty flag
            console.log('Adding space to IndexedDB with dirty flag');
            const serializedSpace = await serializeSpace(testSpace, masterKey);
            if (!serializedSpace) throw new Error('Failed to serialize space');
            await dbApi.addSpace(serializedSpace, { dirty: true });

            // Create the remote space representation in mockDb - use generateTestSpacesOnMockServer as a reference
            console.log('Setting up remote space as deleted in mockDb');
            const remoteId = await mockDb.getNextSpaceId();

            // Add space to mock server
            const mockSpace: MockDbSpace = {
                ID: remoteId,
                CreateTime: testSpace.createdAt,
                DeleteTime: new Date().toISOString(), // Mark as deleted
                SpaceKey: serializedSpace.wrappedSpaceKey || '',
                SpaceTag: testSpace.id,
                Encrypted: (serializedSpace.encrypted || '') as Base64,
            };
            mockDb.addSpace(mockSpace);
            mockDb.deleteSpace(remoteId); // This performs a soft delete

            // Add remoteId mapping to IndexedDB
            await dbApi.addRemoteId({
                type: 'space',
                localId: testSpace.id,
                remoteId,
            });

            // Verify the initial state in IDB
            console.log('Verifying initial state in IDB');
            const initialSpaceInIdb = await dbApi.getSpaceById(testSpace.id);
            if (!initialSpaceInIdb) throw new Error('Space should exist in IDB');
            expect(initialSpaceInIdb.dirty).toBe(true);
            expect(initialSpaceInIdb.deleted).toBeFalsy();

            // Verify the mapping exists
            const storedRemoteId = await dbApi.getRemoteIdFromLocalId('space', testSpace.id);
            expect(storedRemoteId).toBe(remoteId);

            // Verify the initial remote state
            console.log('Verifying initial remote state in mock server');
            const spaceFromMockDb = mockDb.getSpace(remoteId);
            expect(spaceFromMockDb).toBeDefined();
            expect(spaceFromMockDb?.DeleteTime).toBeDefined(); // Should be marked as deleted

            // Start app with existing IndexedDB data
            console.log('Starting app with existing IndexedDB data');
            const { store, dispatch } = await setupTestEnvironment({
                existingDbApi: dbApi,
                existingUserId: userId,
                masterKeyBase64,
            });

            try {
                // The dirty flag should trigger a sync with server
                // The server will tell us the space is deleted
                // This should reconcile by marking the local space as deleted and not dirty

                // Wait for the reconciliation to complete
                console.log('Waiting for the reconciliation to complete');
                await waitForCondition(
                    async () => {
                        const localSpace = await dbApi.getSpaceById(testSpace.id);
                        if (!localSpace) throw new Error('Space should not be hard deleted');
                        console.log('Checking if space is no longer dirty:', localSpace);
                        return !localSpace.dirty && localSpace.deleted === true;
                    },
                    { timeout: 10000, pollInterval: 500 }
                );

                // Verify the space is marked as deleted in IndexedDB and not dirty
                console.log('Verifying space is marked as deleted in IndexedDB and not dirty');
                const finalSpace = await dbApi.getSpaceById(testSpace.id);
                expect(finalSpace).toBeDefined();
                expect(finalSpace!.deleted).toBeTruthy();
                expect(finalSpace!.dirty).toBeFalsy();
                expect(finalSpace!.wrappedSpaceKey).toBeUndefined();

                // Verify the space is not in Redux
                console.log('Verifying space is not in Redux');
                const finalState = store.getState();
                expect(finalState.spaces[testSpace.id]).toBeUndefined();

                // Verify reloading Redux doesn't bring back the space
                console.log('Verifying reloading Redux does not bring back the space');
                dispatch(reloadReduxRequest());
                await sleep(500);
                const stateAfterReload = store.getState();
                expect(stateAfterReload.spaces[testSpace.id]).toBeUndefined();
            } finally {
                dispatch(stopRootSaga());
            }
        }, 15000);

        it('should solve message conflicts', async () => {
            setRetryPushEveryMs(2000); // reduce the retry interval, default is a bit long for tests
            allowConsoleWarn = true; // http 409 will print a warning, but it's intended
            allowConsoleError = true; // http 409 will also print an error, but it's intended
            const { dispatch, dbApi, select } = await setupTestEnvironment();
            try {
                // Create initial space
                console.log('Create initial space');
                const space = createTestSpace();
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: space.id }));

                // Create conversation
                console.log('Create conversation');
                const conversation = createTestConversation(space.id, { title: 'Test Failed Answer' });
                dispatch(addConversation(conversation));
                dispatch(pushConversationRequest({ id: conversation.id }));

                console.log('Waiting for space to sync to server');
                await waitForSpaceSyncWithServer(dbApi, space.id);
                console.log('Waiting for conversation to sync to server');
                await waitForConversationSyncWithServer(dbApi, conversation.id);
                const remoteConversationId = select(
                    selectRemoteIdFromLocal('conversation', conversation.id)
                ) as ConversationId;
                expect(remoteConversationId).toBeDefined();

                // Create one message
                console.log('Create initial message');
                const content = 'Lorem ipsum';
                const message = createTestMessage(conversation.id, Role.User, {
                    content,
                    status: 'succeeded' satisfies Status,
                });
                const messageId = message.id;
                // We have created a message, but the app isn't aware of it (neither Redux nor IndexedDB)

                // Let's add that message to the mock server db directly -- this bypasses the normal flow.
                console.log('Add message to mock server DB (bypass app persistence)');
                const remoteMessageId = await mockDb.getNextMessageId();
                mockDb.addMessage({
                    ID: remoteMessageId,
                    CreateTime: message.createdAt,
                    ConversationID: remoteConversationId,
                    MessageTag: message.id,
                    Encrypted: 'encrypteddata==' as Base64,
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                });

                // Now the app is slightly out-of-sync. It has a message to push, but the local id (also called the
                // message tag) already exists on the server db. The server will detect it and return 409 Conflict.
                // To be clear, what we define as a conflicted state is:
                //   - this local id isn't mapped to a remote id in IndexedDB (no entry exists)
                //   - the server has a db row with this local id (MessageTag) and remote id (MessageId).
                // To be even more clear, fixing the conflict means:
                //   - the local app gets somehow aware of the remote id
                //     and registers the local/remote id mapping in IndexedDB.

                // Alright, let's now make Redux aware of the message...
                console.log('Adding message to Redux');
                dispatch(addMessage(message));
                dispatch(
                    finishMessage({
                        messageId: messageId,
                        conversationId: conversation.id,
                        spaceId: space.id,
                        content,
                        status: 'succeeded' satisfies Status,
                        role: Role.User,
                    })
                );

                // Before we call pushMessageRequest() the message only exists in Redux and not in IndexedDB.
                const idbMessage1 = await dbApi.getMessageById(messageId);
                expect(idbMessage1).toBeUndefined();

                // Now, tell the app to push it to the server. The POST call should resolve with a 409 Conflict.
                console.log('Pushing message to server');
                dispatch(pushMessageRequest({ id: messageId }));
                await waitForCondition(
                    async () => {
                        const idbMessage = await dbApi.getMessageById(messageId);
                        return idbMessage !== undefined;
                    },
                    {
                        message: 'waiting for message to be saved to IDB',
                    }
                );
                const idbMessage2 = (await dbApi.getMessageById(messageId)) as SerializedMessage;
                expect(idbMessage2).toBeDefined();

                // Expect the message to be dirty initially.
                // (The condition below includes a second term, because technically the test could run so fast
                // that the conflict is already solved -- if this is the case the || RHS will be true.)
                expect(idbMessage2.dirty || mockDb.getNbConflictErrors(messageId) > 0);

                // Wait for the server to see the conflict
                await waitForCondition(async () => mockDb.getNbConflictErrors(messageId) > 0, {
                    message: 'waiting for server to see the local id conflict',
                });

                // When a conflict has been detected, the server indicates it with a 409.
                // To fix the conflict, our client will try to refresh the parent conversation.
                // In the conversation listing, we'll see all messages metadata, including
                // the remote id (MessageID) and the local id (MessageTag). This
                // will be sufficient to resolve the conflict by inserting the local/remote id mapping in IndexedDB.

                // Normally we have nothing to do in this test... we should just wait for the remote id to magically
                // appear. How it is done is up to the app implementation.
                console.log('Waiting for conflict to be resolved');
                await waitForMessageSyncWithServer(dbApi, messageId, {
                    message: 'waiting for conflict to be resolved',
                    pollInterval: 2000,
                    timeout: 20000,
                });
            } finally {
                dispatch(stopRootSaga());
            }
        }, 30000);

        it('should delete all spaces and cascade to all related data', async () => {
            const { store, dispatch, dbApi, lumoApi, actionHistory } = await setupTestEnvironment();

            try {
                // Create multiple spaces with conversations, messages, and attachments
                console.log('Creating test data with multiple spaces');
                const testData = createTestData();

                // Add test data to store and wait for persistence
                console.log('Adding test data to store');
                await dispatch(addTestDataToStore(testData));

                // Verify initial state in Redux
                console.log('Verifying initial state in Redux');
                const initialState = store.getState();
                for (const space of testData.spaces) {
                    expect(initialState.spaces[space.id]).toBeDefined();
                }
                for (const conversation of testData.conversations) {
                    expect(initialState.conversations[conversation.id]).toBeDefined();
                }
                for (const message of testData.messages) {
                    expect(initialState.messages[message.id]).toBeDefined();
                }

                // Wait for all spaces to sync with server
                console.log('Waiting for all spaces to sync with server');
                for (const space of testData.spaces) {
                    await waitForSpaceSyncWithServer(dbApi, space.id);
                }

                // Wait for spaces to appear in remote list
                console.log('Waiting for spaces to appear in remote list');
                await waitForCondition(async () => {
                    const result = await lumoApi.listSpaces();
                    return testData.spaces.every((space) => result.spaces[space.id] !== undefined);
                });

                // Wait for all messages to finish syncing (no dirty flags)
                console.log('Waiting for all messages to sync with server');
                for (const message of testData.messages) {
                    await waitForMessageSyncWithServer(dbApi, message.id);
                }

                // Wait for all conversations to finish syncing
                console.log('Waiting for all conversations to sync with server');
                for (const conversation of testData.conversations) {
                    await waitForConversationSyncWithServer(dbApi, conversation.id);
                }

                // Verify initial counts
                const initialSpaceCount = testData.spaces.length;
                const initialConversationCount = testData.conversations.length;
                const initialMessageCount = testData.messages.length;
                console.log(
                    `Initial counts - Spaces: ${initialSpaceCount}, Conversations: ${initialConversationCount}, Messages: ${initialMessageCount}`
                );

                // Execute delete all spaces
                console.log('Executing delete all spaces');
                dispatch(deleteAllSpacesRequest());

                // Wait for all spaces to be removed from Redux
                console.log('Waiting for all spaces to be removed from Redux');
                await waitForCondition(
                    async () => {
                        const state = store.getState();
                        return Object.keys(state.spaces).length === 0;
                    },
                    { message: 'Waiting for all spaces to be removed from Redux' }
                );

                // Wait for all conversations to be removed from Redux (cascading deletion)
                console.log('Waiting for all conversations to be removed from Redux (cascading deletion)');
                await waitForCondition(
                    async () => {
                        const state = store.getState();
                        return Object.keys(state.conversations).length === 0;
                    },
                    { message: 'Waiting for all conversations to be removed from Redux' }
                );

                // Wait for all messages to be removed from Redux (cascading deletion)
                console.log('Waiting for all messages to be removed from Redux (cascading deletion)');
                await waitForCondition(
                    async () => {
                        const state = store.getState();
                        return Object.keys(state.messages).length === 0;
                    },
                    { message: 'Waiting for all messages to be removed from Redux' }
                );

                // Verify final Redux state is empty
                console.log('Verifying final Redux state is empty');
                const finalState = store.getState();
                expect(Object.keys(finalState.spaces)).toHaveLength(0);
                expect(Object.keys(finalState.conversations)).toHaveLength(0);
                expect(Object.keys(finalState.messages)).toHaveLength(0);
                expect(Object.keys(finalState.attachments)).toHaveLength(0);

                // Verify spaces are soft deleted in IndexedDB
                console.log('Verifying spaces are soft deleted in IndexedDB');
                for (const space of testData.spaces) {
                    const idbSpace = await dbApi.getSpaceById(space.id);
                    expect(idbSpace).toBeDefined();
                    expect(idbSpace!.deleted).toBe(true);
                    expect(idbSpace!.wrappedSpaceKey).toBeUndefined();
                }

                // Verify conversations are removed from IndexedDB
                console.log('Verifying conversations are removed from IndexedDB');
                const remainingConversations = await dbApi.getAllConversations();
                expect(remainingConversations.filter((c) => !c.deleted)).toHaveLength(0);

                // Verify messages are removed from IndexedDB
                console.log('Verifying messages are removed from IndexedDB');
                const remainingMessages = await dbApi.getAllMessages();
                expect(remainingMessages.filter((m) => !m.deleted)).toHaveLength(0);

                // Verify reloading Redux from IndexedDB results in empty state
                console.log('Verifying reloading Redux from IndexedDB results in empty state');
                dispatch(reloadReduxRequest());
                await sleep(1000);

                const reloadedState = store.getState();
                expect(Object.keys(reloadedState.spaces)).toHaveLength(0);
                expect(Object.keys(reloadedState.conversations)).toHaveLength(0);
                expect(Object.keys(reloadedState.messages)).toHaveLength(0);
                expect(Object.keys(reloadedState.attachments)).toHaveLength(0);

                // Verify that deleteAllSpacesSuccess action was dispatched
                console.log('Verifying deleteAllSpacesSuccess action was dispatched');
                expect(actionHistory.hasAction(deleteAllSpacesSuccess.type)).toBe(true);

                console.log('Delete all spaces test completed successfully');
            } finally {
                dispatch(stopRootSaga());
            }
        }, 30000);

        it('should handle delete all spaces failure and preserve local data', async () => {
            allowConsoleError = true; // Allow error logging during failure case
            const { store, dispatch, dbApi, actionHistory } = await setupTestEnvironment();

            try {
                // Create multiple spaces with conversations, messages, and attachments
                console.log('Creating test data with multiple spaces');
                const testData = createTestData();

                // Add test data to store and wait for persistence
                console.log('Adding test data to store');
                await dispatch(addTestDataToStore(testData));

                // Verify initial state in Redux
                console.log('Verifying initial state in Redux');
                const initialState = store.getState();
                for (const space of testData.spaces) {
                    expect(initialState.spaces[space.id]).toBeDefined();
                }
                for (const conversation of testData.conversations) {
                    expect(initialState.conversations[conversation.id]).toBeDefined();
                }
                for (const message of testData.messages) {
                    expect(initialState.messages[message.id]).toBeDefined();
                }

                // Wait for all spaces to sync with server
                console.log('Waiting for all spaces to sync with server');
                for (const space of testData.spaces) {
                    await waitForSpaceSyncWithServer(dbApi, space.id);
                }

                // Store initial counts for comparison
                const initialSpaceCount = Object.keys(initialState.spaces).length;
                const initialConversationCount = Object.keys(initialState.conversations).length;
                const initialMessageCount = Object.keys(initialState.messages).length;
                console.log(
                    `Initial counts - Spaces: ${initialSpaceCount}, Conversations: ${initialConversationCount}, Messages: ${initialMessageCount}`
                );

                // Inject server error for DELETE /api/lumo/v1/spaces
                console.log('Injecting server error for DELETE /api/lumo/v1/spaces');
                mockErrorHandler.injectError('/api/lumo/v1/spaces', 'DELETE', 500);

                // Execute delete all spaces (should fail)
                console.log('Executing delete all spaces (expecting failure)');
                dispatch(deleteAllSpacesRequest());

                // Wait for the failure action to be dispatched by checking for error in console output
                // Since we're expecting a failure, we wait a bit for the error to be thrown and caught
                console.log('Waiting for delete all spaces failure');
                await sleep(2000); // Give time for the API call to fail and error to be logged

                // Verify that Redux state is unchanged (no deletion occurred)
                console.log('Verifying Redux state is unchanged after failure');
                const stateAfterFailure = store.getState();
                expect(Object.keys(stateAfterFailure.spaces)).toHaveLength(initialSpaceCount);
                expect(Object.keys(stateAfterFailure.conversations)).toHaveLength(initialConversationCount);
                expect(Object.keys(stateAfterFailure.messages)).toHaveLength(initialMessageCount);

                // Verify that IndexedDB data is unchanged (no soft deletion occurred)
                console.log('Verifying IndexedDB data is unchanged after failure');
                for (const space of testData.spaces) {
                    const idbSpace = await dbApi.getSpaceById(space.id);
                    expect(idbSpace).toBeDefined();
                    expect(idbSpace!.deleted).toBeFalsy(); // Should not be soft deleted
                }

                // Verify conversations are not soft deleted
                const conversationsAfterFailure = await dbApi.getAllConversations();
                const nonDeletedConversations = conversationsAfterFailure.filter((c) => !c.deleted);
                expect(nonDeletedConversations).toHaveLength(initialConversationCount);

                // Verify messages are not soft deleted
                const messagesAfterFailure = await dbApi.getAllMessages();
                const nonDeletedMessages = messagesAfterFailure.filter((m) => !m.deleted);
                expect(nonDeletedMessages).toHaveLength(initialMessageCount);

                // Verify that deleteAllSpacesFailure action was dispatched
                console.log('Verifying deleteAllSpacesFailure action was dispatched');
                expect(actionHistory.hasAction(deleteAllSpacesFailure.type)).toBe(true);

                // Remove error injection and verify that delete works properly now
                console.log('Removing error injection and testing successful delete');
                mockErrorHandler.clearAllErrors();

                // Clear action history to isolate the success case
                actionHistory.clear();

                // Wait a bit before trying again to ensure error injection is cleared
                await sleep(1000);

                // Execute delete all spaces again (should succeed now)
                console.log('Executing delete all spaces again (should succeed)');
                dispatch(deleteAllSpacesRequest());

                // Wait for all spaces to be removed from Redux
                console.log('Waiting for all spaces to be removed from Redux after error cleared');
                await waitForCondition(
                    async () => {
                        const state = store.getState();
                        return Object.keys(state.spaces).length === 0;
                    },
                    { message: 'Waiting for all spaces to be removed from Redux after error cleared', timeout: 15000 }
                );

                // Verify successful deletion after error was cleared
                console.log('Verifying successful deletion after error was cleared');
                const finalState = store.getState();
                expect(Object.keys(finalState.spaces)).toHaveLength(0);
                expect(Object.keys(finalState.conversations)).toHaveLength(0);
                expect(Object.keys(finalState.messages)).toHaveLength(0);

                // Verify that deleteAllSpacesSuccess action was dispatched after retry
                console.log('Verifying deleteAllSpacesSuccess action was dispatched after retry');
                expect(actionHistory.hasAction(deleteAllSpacesSuccess.type)).toBe(true);

                console.log('Delete all spaces failure test completed successfully');
            } finally {
                // Always clear any remaining error injections
                mockErrorHandler.clearAllErrors();
                allowConsoleError = false; // Reset console error handling
                dispatch(stopRootSaga());
            }
        }, 30000);

        it('should persist delete all spaces across multiple app sessions', async () => {
            allowConsoleError = true; // Allow expected error logs during saga operations

            const { dispatch, dbApi, actionHistory, select } = await setupTestEnvironment();

            // Simple selectors to get all items as arrays from state maps
            const selectAllSpaces = (state: any) => Object.values(state.spaces);
            const selectAllConversations = (state: any) => Object.values(state.conversations);
            const selectAllMessages = (state: any) => Object.values(state.messages);

            try {
                console.log('=== Session 1: Create test data ===');

                // Create test spaces
                const spaceIds = [newSpaceId(), newSpaceId()];
                const spaces = spaceIds.map((id) => createTestSpace({ id }));

                for (const space of spaces) {
                    dispatch(addSpace(space));
                    dispatch(pushSpaceRequest({ id: space.id }));
                }

                // Create conversations for each space
                const conversationIds = [newConversationId(), newConversationId()];
                const now = new Date().toISOString();
                const conversations = conversationIds.map((id, index) => ({
                    id,
                    spaceId: spaceIds[index],
                    createdAt: now,
                    updatedAt: now,
                    title: `Test conversation ${index + 1}`, // Required field
                }));

                for (const conversation of conversations) {
                    dispatch(addConversation(conversation));
                    dispatch(pushConversationRequest({ id: conversation.id }));
                }

                // Create messages for each conversation
                const messageIds = [newMessageId(), newMessageId()];
                const messages = messageIds.map((id, index) => ({
                    id,
                    conversationId: conversationIds[index],
                    content: `Test message content ${index + 1}`,
                    createdAt: new Date().toISOString(),
                    role: Role.User, // Required field
                }));

                for (const message of messages) {
                    dispatch(addMessage(message));
                    dispatch(pushMessageRequest({ id: message.id }));
                }

                // Wait for all data to be persisted to IndexedDB
                console.log('Waiting for all data to be persisted to IndexedDB');
                await waitForCondition(
                    async () => {
                        const tx = await dbApi.newTransaction(
                            [SPACE_STORE, CONVERSATION_STORE, MESSAGE_STORE],
                            'readonly'
                        );
                        const idbSpaces = await dbApi.getAllSpaces(tx);
                        const idbConversations = await dbApi.getAllConversations(tx);
                        const idbMessages = await dbApi.getAllMessages(tx);

                        console.log(
                            `IDB counts: spaces=${idbSpaces.length}, conversations=${idbConversations.length}, messages=${idbMessages.length}`
                        );
                        return idbSpaces.length === 2 && idbConversations.length === 2 && idbMessages.length === 2;
                    },
                    { message: 'All data to be persisted to IndexedDB' }
                );

                // Verify initial state
                console.log('Verify initial Redux state has all data');
                const initialSpaces = select(selectAllSpaces);
                const initialConversations = select(selectAllConversations);
                const initialMessages = select(selectAllMessages);

                expect(initialSpaces).toHaveLength(2);
                expect(initialConversations).toHaveLength(2);
                expect(initialMessages).toHaveLength(2);

                console.log('=== Session 1: Perform delete all spaces ===');
                actionHistory.clear();
                dispatch(deleteAllSpacesRequest());

                // Wait for the success action
                await waitForCondition(async () => actionHistory.hasAction(deleteAllSpacesSuccess.type), {
                    message: 'delete all spaces success action to be dispatched',
                });

                // Verify Redux is cleared
                console.log('Verify Redux state is cleared after delete');
                expect(select(selectAllSpaces)).toHaveLength(0);
                expect(select(selectAllConversations)).toHaveLength(0);
                expect(select(selectAllMessages)).toHaveLength(0);

                console.log('=== Session 1 -> Session 2: Simulate app restart ===');

                // Unload Redux to simulate app closing
                dispatch(unloadReduxRequest());

                // Wait for unload to complete
                await waitForCondition(
                    async () => {
                        const spaces = select(selectAllSpaces);
                        const conversations = select(selectAllConversations);
                        const messages = select(selectAllMessages);
                        return spaces.length === 0 && conversations.length === 0 && messages.length === 0;
                    },
                    { message: 'Redux state to be unloaded' }
                );

                // Reload Redux from IndexedDB to simulate app reopening
                console.log('Reload Redux from IndexedDB (simulating app restart)');
                dispatch(reloadReduxRequest());

                // Wait for reload to complete
                await waitForCondition(
                    async () => {
                        // Should still be empty because everything was soft-deleted
                        const spaces = select(selectAllSpaces);
                        const conversations = select(selectAllConversations);
                        const messages = select(selectAllMessages);
                        return spaces.length === 0 && conversations.length === 0 && messages.length === 0;
                    },
                    { message: 'Redux state to remain empty after reload' }
                );

                console.log('=== Session 2: Verify deletion persisted ===');

                // Verify Redux state is still empty (deleted items not loaded)
                expect(select(selectAllSpaces)).toHaveLength(0);
                expect(select(selectAllConversations)).toHaveLength(0);
                expect(select(selectAllMessages)).toHaveLength(0);

                // Verify IndexedDB still contains the soft-deleted items
                console.log('Verify IndexedDB contains soft-deleted items');
                const tx = await dbApi.newTransaction([SPACE_STORE, CONVERSATION_STORE, MESSAGE_STORE], 'readonly');
                const idbSpaces = await dbApi.getAllSpaces(tx);
                const idbConversations = await dbApi.getAllConversations(tx);
                const idbMessages = await dbApi.getAllMessages(tx);

                expect(idbSpaces).toHaveLength(2);
                expect(idbConversations).toHaveLength(2);
                expect(idbMessages).toHaveLength(2);

                // All items should be marked as deleted
                for (const space of idbSpaces) {
                    expect(space.deleted).toBe(true);
                }
                for (const conversation of idbConversations) {
                    expect(conversation.deleted).toBe(true);
                }
                for (const message of idbMessages) {
                    expect(message.deleted).toBe(true);
                }

                console.log('=== Session 2 -> Session 3: Another restart cycle ===');

                // Perform another unload/reload cycle to ensure consistency
                dispatch(unloadReduxRequest());

                await waitForCondition(
                    async () => {
                        const spaces = select(selectAllSpaces);
                        return spaces.length === 0;
                    },
                    { message: 'Redux state to be unloaded again' }
                );

                dispatch(reloadReduxRequest());

                await waitForCondition(
                    async () => {
                        // Should still be empty
                        const spaces = select(selectAllSpaces);
                        return spaces.length === 0;
                    },
                    { message: 'Redux state to remain empty after second reload' }
                );

                console.log('=== Session 3: Final verification ===');

                // Final verification that deletion is persistent across multiple sessions
                expect(select(selectAllSpaces)).toHaveLength(0);
                expect(select(selectAllConversations)).toHaveLength(0);
                expect(select(selectAllMessages)).toHaveLength(0);

                console.log('Multi-session delete all spaces test completed successfully');
            } finally {
                allowConsoleError = false;
                dispatch(stopRootSaga());
            }
        }, 45000); // Longer timeout for multiple session cycles

        // FIXME: This test is flaky on the CI server. It's not clear why.
        // Error: Browser 2 to see space deletion from server: Timed out after 15000ms
        //     at /builds/web/clients/applications/lumo/src/app/test/integration/helpers.ts:92:19
        //     at /builds/web/clients/node_modules/@babel/runtime/helpers/regeneratorRuntime.js:52:18
        //     at Generator.<anonymous>
        it.skip('should sync delete all spaces across independent browsers', async () => {
            allowConsoleError = true; // Allow expected error logs during saga operations

            // Generate a shared master key for both browsers
            const sharedMasterKeyBase64 = generateMasterKeyBase64();

            // === Browser 1 Setup ===
            const browser1 = await setupTestEnvironment({ masterKeyBase64: sharedMasterKeyBase64 });
            const browser1Select = browser1.select;
            const selectAllSpacesBrowser1 = (state: any) => Object.values(state.spaces);

            try {
                console.log('=== Browser 1: Create and push spaces to server ===');

                // Create test spaces in Browser 1
                const spaceIds = [newSpaceId(), newSpaceId()];
                const spaces = spaceIds.map((id) => createTestSpace({ id }));

                for (const space of spaces) {
                    browser1.dispatch(addSpace(space));
                    browser1.dispatch(pushSpaceRequest({ id: space.id }));
                }

                // Wait for Browser 1 to push spaces to server
                console.log('Waiting for Browser 1 to push spaces to server');
                await waitForCondition(
                    async () => {
                        const serverSpaces = mockDb.listSpaces();
                        console.log(`Server spaces count: ${serverSpaces.length}`);
                        return serverSpaces.length === 2;
                    },
                    { message: 'Browser 1 spaces to be pushed to server', timeout: 15000 }
                );

                console.log('Browser 1 has successfully pushed spaces to server');

                // === Browser 2 Setup ===
                console.log('=== Browser 2: Pull spaces from server ===');

                const browser2 = await setupTestEnvironment({ masterKeyBase64: sharedMasterKeyBase64 });
                const browser2Select = browser2.select;
                const selectAllSpacesBrowser2 = (state: any) => Object.values(state.spaces);

                try {
                    // Browser 2 pulls spaces from server
                    console.log('Browser 2 pulling spaces from server');

                    // Also verify server state before pull
                    const serverSpacesBefore = mockDb.listSpaces();
                    console.log(
                        `Server has ${serverSpacesBefore.length} spaces before Browser 2 pull:`,
                        serverSpacesBefore.map((s) => s.ID)
                    );

                    browser2.dispatch(pullSpacesRequest());

                    // Wait for Browser 2 to sync spaces from server
                    await waitForCondition(
                        async () => {
                            const spaces = browser2Select(selectAllSpacesBrowser2);
                            console.log(`Browser 2 spaces count: ${spaces.length}`);

                            // Additional debugging
                            if (spaces.length === 0) {
                                console.log('Browser 2 still has no spaces, checking server again...');
                                const serverSpaces = mockDb.listSpaces();
                                console.log(`Server still has ${serverSpaces.length} spaces`);
                            }

                            return spaces.length === 2;
                        },
                        { message: 'Browser 2 to sync spaces from server', timeout: 15000 }
                    );

                    console.log('Browser 2 has successfully synced spaces from server');

                    // === Browser 1: Delete all spaces ===
                    console.log('=== Browser 1: Delete all spaces ===');

                    browser1.actionHistory.clear();
                    browser1.dispatch(deleteAllSpacesRequest());

                    // Wait for Browser 1 delete operation to complete
                    await waitForCondition(async () => browser1.actionHistory.hasAction(deleteAllSpacesSuccess.type), {
                        message: 'Browser 1 delete all spaces to complete',
                        timeout: 10000,
                    });

                    // Verify Browser 1 state is cleared
                    expect(browser1Select(selectAllSpacesBrowser1)).toHaveLength(0);

                    console.log('Browser 1 has successfully deleted all spaces');

                    // === Browser 2: Eventually sees the deletion ===
                    console.log('=== Browser 2: Should eventually see deletion ===');

                    // Browser 2 pulls updates from server
                    console.log('Browser 2 pulling updates from server');
                    browser2.dispatch(pullSpacesRequest());

                    // Wait for Browser 2 to eventually see empty state
                    await waitForCondition(
                        async () => {
                            const spaces = browser2Select(selectAllSpacesBrowser2);
                            console.log(`Browser 2 after deletion sync: spaces=${spaces.length}`);
                            return spaces.length === 0;
                        },
                        { message: 'Browser 2 to see space deletion from server', timeout: 15000 }
                    );

                    console.log('=== Verification: Cross-browser spaces sync completed ===');

                    // Final verification - both browsers should see empty spaces
                    expect(browser1Select(selectAllSpacesBrowser1)).toHaveLength(0);
                    expect(browser2Select(selectAllSpacesBrowser2)).toHaveLength(0);

                    console.log('Cross-browser delete all spaces sync test completed successfully');
                } finally {
                    browser2.dispatch(stopRootSaga());
                }
            } finally {
                allowConsoleError = false;
                browser1.dispatch(stopRootSaga());
            }
        }, 60000); // Longer timeout for cross-browser operations
    });

    describe('Persistence of attachments', () => {
        it('should be saved to Redux, IDB, remote, and then deleted', async () => {
            allowConsoleError = true; // redux serializable checks

            const { store, dispatch, dbApi, lumoApi, select } = await setupTestEnvironment();
            try {
                // Create a test space first
                console.log('Creating test space');
                const spaceId = newSpaceId();
                const space = createTestSpace({ id: spaceId });
                dispatch(addSpace(space));
                dispatch(pushSpaceRequest({ id: spaceId }));

                // Create a simple text file for testing
                console.log('Creating test file');
                const content = 'Hello, this is a test file';
                const blob = new Blob([content], { type: 'text/plain' });
                const file = new File([blob], 'test.txt', { type: 'text/plain' });

                // Create a simple mock implementation that just creates an attachment and dispatches it
                console.log('Creating mock attachment');
                const id = newAttachmentId();
                const attachment = {
                    id,
                    spaceId, // Associate with the test space
                    mimeType: file.type,
                    uploadedAt: new Date().toISOString(),
                    rawBytes: file.size,
                    processing: false,
                    filename: file.name,
                    // Use Uint8Array directly since that's what the type expects
                    data: new Uint8Array(await file.arrayBuffer()),
                };

                // Add attachment to Redux store using the new action flow
                console.log('Dispatching attachment to Redux store');
                dispatch(upsertAttachment(attachment));
                dispatch(pushAttachmentRequest({ id }));

                // Check if the attachment was added to the store
                console.log('Verifying attachment in Redux store');
                const state = store.getState();
                const attachments = state.attachments;

                // There should be at least one attachment
                expect(Object.keys(attachments).length).toBeGreaterThan(0);

                // Get the test attachment
                const reduxAttachment = attachments[id];

                // Verify attachment properties
                expect(reduxAttachment).toBeDefined();
                expect(reduxAttachment.mimeType).toBe('text/plain');
                expect(reduxAttachment.filename).toBe('test.txt');
                expect(reduxAttachment.rawBytes).toBe(blob.size);
                expect(reduxAttachment.processing).toBeFalsy();
                expect(reduxAttachment.spaceId).toBe(spaceId);

                // Wait for space and attachment to be saved to IndexedDB
                await waitForValue(() => dbApi.getSpaceById(spaceId), {
                    message: 'Waiting for space to be persisted to IndexedDB',
                });
                console.log('Waiting for attachment to be persisted to IndexedDB');
                const idbAttachment = await waitForValue(() => dbApi.getAttachmentById(id), {
                    message: 'Waiting for attachment to be persisted to IndexedDB',
                });
                expect(idbAttachment).toBeDefined();
                expect(idbAttachment.id).toBe(id);
                expect(idbAttachment.mimeType).toBe('text/plain');
                expect(idbAttachment.rawBytes).toBe(blob.size);
                expect(idbAttachment.processing).toBeFalsy();
                expect(idbAttachment.spaceId).toBe(spaceId);

                console.log('Waiting for attachment to be sent to server');
                await waitForAttachmentSyncWithServer(dbApi, id);

                // Check that the attachment is listed along with the space
                const remoteSpaceId = select(selectRemoteIdFromLocal('attachment', id));
                expect(remoteSpaceId).toBeDefined();
                const getSpace = await lumoApi.getSpace(remoteSpaceId!);
                expect(getSpace).toBeDefined();
                expect(getSpace!.space.id).toBe(spaceId);
                expect(getSpace!.deletedAssets).toHaveLength(0);
                expect(getSpace!.assets).toHaveLength(1);
                expect(getSpace!.assets[0].id).toBe(id);
                expect(getSpace!.assets[0].spaceId).toBe(spaceId);

                // Test deletion flow
                console.log('Testing attachment deletion');
                dispatch(locallyDeleteAttachmentFromLocalRequest(id));
                dispatch(pushAttachmentRequest({ id }));

                // Wait for attachment to be soft-deleted in IDB
                console.log('Waiting for attachment to be soft-deleted in IDB');
                const deletedAttachment = await waitForValue(
                    async () => {
                        const attachment = await dbApi.getAttachmentById(id);
                        if (!attachment) throw new Error('Attachment has disappeared from IDB');
                        return attachment.deleted === true ? attachment : undefined;
                    },
                    { message: 'Waiting for attachment to be soft-deleted in IDB' }
                );

                // Verify deletion was processed
                console.log('Verifying deletion was processed');
                expect(deletedAttachment).toBeDefined();
                expect(deletedAttachment!.deleted).toBeTruthy();

                // Wait until that deletion was sent to the server
                await waitForAttachmentSyncWithServer(dbApi, id);

                // At this point GET attachment should return deleted=true
                console.log('Verify attachment is deleted in http get call');
                const remoteAttachmentId = select(selectRemoteIdFromLocal('attachment', id));
                expect(remoteAttachmentId).toBeDefined();
                const result = await lumoApi.getAttachment(remoteAttachmentId!, spaceId);
                expect(result).toBeDefined();
                expect(result!.deleted).toBeTruthy();

                // Verify attachment is removed from Redux
                console.log('Verifying attachment is removed from Redux');
                const finalReduxAttachment = select(selectAttachmentById(id));
                expect(finalReduxAttachment).toBeUndefined();
            } finally {
                dispatch(stopRootSaga());
            }
        }, 10000);

        it('provisional attachment should not be persisted', async () => {
            allowConsoleError = true; // redux serializable checks

            const { store, dispatch, dbApi, lumoApi, select } = await setupTestEnvironment();
            try {
                // Create a simple text file for testing
                console.log('Creating test file');
                const content = 'Hello, this is a test file';
                const blob = new Blob([content], { type: 'text/plain' });
                const file = new File([blob], 'test.txt', { type: 'text/plain' });

                // Create a provisional attachment (no spaceId)
                console.log('Creating provisional attachment');
                const id = newAttachmentId();
                const attachment = {
                    id,
                    mimeType: file.type,
                    uploadedAt: new Date().toISOString(),
                    rawBytes: file.size,
                    processing: false,
                    filename: file.name,
                    data: new Uint8Array(await file.arrayBuffer()),
                };

                // Add attachment to Redux store
                console.log('Dispatching attachment to Redux store');
                dispatch(upsertAttachment(attachment));
                dispatch(pushAttachmentRequest({ id })); // this should do nothing on provisional attachments

                // Verify attachment is in Redux store
                console.log('Verifying attachment in Redux store');
                const state = store.getState();
                const reduxAttachment = state.attachments[id];
                expect(reduxAttachment).toBeDefined();
                expect(reduxAttachment.mimeType).toBe('text/plain');
                expect(reduxAttachment.filename).toBe('test.txt');
                expect(reduxAttachment.spaceId).toBeUndefined();

                // Wait a bit to ensure any persistence attempts would have happened
                await sleep(1000);

                // Verify attachment is NOT in IndexedDB
                console.log('Verifying attachment is not in IndexedDB');
                const idbAttachment = await dbApi.getAttachmentById(id);
                expect(idbAttachment).toBeUndefined();

                // Verify no remote ID mapping exists
                console.log('Verifying no remote ID mapping exists');
                const remoteId = select(selectRemoteIdFromLocal('attachment', id));
                expect(remoteId).toBeUndefined();

                // Verify attachment is not in remote list
                console.log('Verifying attachment is not in remote list');
                const spaces = await lumoApi.listSpaces();
                for (const space of Object.values(spaces.spaces)) {
                    const spaceAssets = await lumoApi.getSpace(space.remoteId);
                    expect(spaceAssets?.assets).not.toContainEqual(expect.objectContaining({ id }));
                }
            } finally {
                dispatch(stopRootSaga());
            }
        }, 10000);

        it('should pull full attachment data when fetching messages in fresh browser session', async () => {
            allowConsoleError = true; // redux serializable checks

            const masterKeyBase64 = generateMasterKeyBase64();
            const userId = generateFakeUserId();

            // First session: Create space, conversation, message with attachment
            console.log('First session: Creating space, conversation, and message with attachment');
            let testSpaceId: SpaceId;
            let testConversationId: ConversationId;
            let testMessageId: string;
            let testAttachmentId: string;
            let testAttachmentContent: string;

            {
                const { dispatch, dbApi } = await setupTestEnvironment({
                    masterKeyBase64,
                    existingUserId: userId,
                });

                try {
                    // Create space
                    console.log('Creating test space');
                    testSpaceId = newSpaceId();
                    const space = createTestSpace({ id: testSpaceId });
                    dispatch(addSpace(space));
                    dispatch(pushSpaceRequest({ id: testSpaceId }));

                    // Create conversation
                    console.log('Creating test conversation');
                    testConversationId = newConversationId();
                    const now = new Date().toISOString();
                    const conversation = {
                        id: testConversationId,
                        spaceId: testSpaceId,
                        createdAt: now,
                        updatedAt: now,
                        title: 'Test Conversation with Attachment',
                        status: ConversationStatus.COMPLETED,
                    };
                    dispatch(addConversation(conversation));
                    dispatch(pushConversationRequest({ id: testConversationId }));

                    // Create attachment with markdown content
                    console.log('Creating test attachment with markdown content');
                    testAttachmentContent = '# Test Document\n\nThis is a test markdown document with some content.';
                    const blob = new Blob([testAttachmentContent], { type: 'text/markdown' });
                    const file = new File([blob], 'test.md', { type: 'text/markdown' });

                    testAttachmentId = newAttachmentId();
                    const attachment = {
                        id: testAttachmentId,
                        spaceId: testSpaceId,
                        mimeType: file.type,
                        uploadedAt: new Date().toISOString(),
                        rawBytes: file.size,
                        processing: false,
                        filename: file.name,
                        data: new Uint8Array(await file.arrayBuffer()),
                        markdown: testAttachmentContent, // This is the key field that should be preserved
                    };

                    dispatch(upsertAttachment(attachment));
                    dispatch(pushAttachmentRequest({ id: testAttachmentId }));

                    // Create message with attachment reference
                    console.log('Creating test message with attachment');
                    testMessageId = newMessageId();
                    const { data, markdown, ...shallowAttachment } = attachment;
                    const message: Message = {
                        id: testMessageId,
                        conversationId: testConversationId,
                        createdAt: new Date().toISOString(),
                        role: Role.User,
                        status: 'succeeded' as Status,
                        content: 'Here is a message with an attachment',
                        attachments: [shallowAttachment],
                    };

                    dispatch(addMessage(message));
                    dispatch(
                        finishMessage({
                            messageId: testMessageId,
                            conversationId: testConversationId,
                            spaceId: testSpaceId,
                            content: 'Here is a message with an attachment',
                            status: 'succeeded' as Status,
                            role: Role.User,
                        })
                    );
                    dispatch(pushMessageRequest({ id: testMessageId }));

                    // Wait for everything to sync to server
                    console.log('Waiting for space to sync to server');
                    await waitForSpaceSyncWithServer(dbApi, testSpaceId);

                    console.log('Waiting for conversation to sync to server');
                    await waitForConversationSyncWithServer(dbApi, testConversationId);

                    console.log('Waiting for message to sync to server');
                    await waitForMessageSyncWithServer(dbApi, testMessageId);

                    console.log('Waiting for attachment to sync to server');
                    await waitForAttachmentSyncWithServer(dbApi, testAttachmentId);

                    // Verify attachment is fully persisted in first session
                    console.log('Verifying attachment is fully persisted in first session');
                    const persistedAttachment = await dbApi.getAttachmentById(testAttachmentId);
                    expect(persistedAttachment).toBeDefined();
                    // Check that the attachment has encrypted data (indicating it's fully persisted)
                    expect(persistedAttachment!.encrypted).toBeDefined();
                } finally {
                    dispatch(stopRootSaga());
                }
            }

            // Second session: Fresh browser session (new Redux, new IndexedDB)
            console.log('Second session: Fresh browser session - pulling conversation');
            {
                const { store, dispatch, dbApi, select } = await setupTestEnvironment({
                    masterKeyBase64,
                    existingUserId: userId,
                    // Don't pass existingDbApi - this simulates a fresh browser session
                });

                try {
                    // Wait for spaces to be loaded from server
                    console.log('Waiting for spaces to be loaded from server');
                    await waitForCondition(
                        async () => {
                            const state = store.getState();
                            return state.spaces[testSpaceId] !== undefined;
                        },
                        { message: 'Waiting for spaces to be loaded from server' }
                    );

                    // Verify space is loaded
                    console.log('Verifying space is loaded');
                    const state = store.getState();
                    expect(state.spaces[testSpaceId]).toBeDefined();

                    // Pull the specific conversation
                    console.log('Pulling conversation from server');
                    dispatch(pullConversationRequest({ id: testConversationId }));

                    // Wait for conversation to be loaded
                    console.log('Waiting for conversation to be loaded');
                    await waitForCondition(
                        async () => {
                            const state = store.getState();
                            return state.conversations[testConversationId] !== undefined;
                        },
                        { message: 'Waiting for conversation to be loaded' }
                    );

                    // Wait for messages to be loaded
                    console.log('Waiting for messages to be loaded');
                    await waitForCondition(
                        async () => {
                            const messages = select(selectMessagesByConversationId(testConversationId));
                            return mapLength(messages) > 0;
                        },
                        { message: 'Waiting for messages to be loaded' }
                    );

                    // Wait for full message content to be loaded
                    console.log('Waiting for full message content to be loaded');
                    await waitForCondition(
                        async () => {
                            const message = select(selectMessageById(testMessageId));
                            return message?.content !== undefined;
                        },
                        { message: 'Waiting for full message content to be loaded' }
                    );

                    // Verify message has attachment reference
                    console.log('Verifying message has attachment reference');
                    const loadedMessage = select(selectMessageById(testMessageId));
                    expect(loadedMessage).toBeDefined();
                    expect(loadedMessage!.attachments).toBeDefined();
                    expect(loadedMessage!.attachments!.some((att) => att.id === testAttachmentId)).toBe(true);

                    // Verify attachment is in Redux (shallow initially)
                    console.log('Verifying attachment is in Redux (shallow initially)');
                    const shallowReduxAttachment = select(selectAttachmentById(testAttachmentId));
                    expect(shallowReduxAttachment).toBeDefined();
                    expect(shallowReduxAttachment!.id).toBe(testAttachmentId);
                    expect(shallowReduxAttachment!.filename).toBe('test.md');

                    // Wait for full attachment to be available in IndexedDB
                    // This should happen automatically via considerRequestingFullAttachment
                    console.log('Waiting for full attachment to be available in IndexedDB');
                    const fullAttachment = await waitForValue(
                        async () => {
                            const attachment = await dbApi.getAttachmentById(testAttachmentId);
                            // The attachment should have encrypted data, indicating it's fully persisted
                            return attachment?.encrypted ? attachment : undefined;
                        },
                        {
                            message: 'Waiting for full attachment with encrypted data to be available in IndexedDB',
                            timeout: 10000,
                            pollInterval: 500,
                        }
                    );

                    // Verify the full attachment data is correctly persisted in IDB
                    console.log('Verifying full attachment data is correctly persisted in IDB');
                    expect(fullAttachment).toBeDefined();
                    expect(fullAttachment!.id).toBe(testAttachmentId);
                    expect(fullAttachment!.mimeType).toBe('text/markdown');
                    expect(fullAttachment!.spaceId).toBe(testSpaceId);
                    expect(fullAttachment!.encrypted).toBeDefined();

                    // Verify the attachment can be decrypted and has the correct content
                    console.log('Verifying attachment can be decrypted and has correct content');
                    const space = store.getState().spaces[testSpaceId];
                    const spaceDek = await getSpaceDek(space);
                    const decryptedAttachment = await deserializeAttachment(fullAttachment!, spaceDek);
                    expect(decryptedAttachment).toBeDefined();
                    expect(decryptedAttachment!.filename).toBe('test.md');
                    expect(decryptedAttachment!.markdown).toBe(testAttachmentContent);

                    // Wait for the full attachment (with markdown) to be in Redux
                    // This happens when refreshFilledAttachmentFromRemote puts it there
                    console.log('Waiting for attachment with full markdown content in Redux');
                    await waitForCondition(
                        async () => {
                            const att = select(selectAttachmentById(testAttachmentId));
                            return att?.markdown === testAttachmentContent;
                        },
                        { message: 'Waiting for full attachment content to appear in Redux' }
                    );

                    // Final verification: attachment data is in Redux with full content
                    console.log('Verifying attachment data is in Redux with full content');
                    const finalReduxAttachment = select(selectAttachmentById(testAttachmentId));
                    expect(finalReduxAttachment).toBeDefined();
                    expect(finalReduxAttachment!.markdown).toBe(testAttachmentContent);

                    console.log('Test completed successfully!');
                } finally {
                    dispatch(stopRootSaga());
                }
            }
        }, 20000);

        it('should pull space with attachments when opening URL directly in fresh session', async () => {
            allowConsoleError = true; // redux serializable checks

            const masterKeyBase64 = generateMasterKeyBase64();
            const userId = generateFakeUserId();

            // Session 1 (Tab 1): Create space and attachment, sync to server
            console.log('Session 1: Creating space and attachment');
            let testSpaceId: SpaceId;
            let testAttachmentId: string;
            let testAttachmentContent: string;
            let testAttachmentFilename: string;

            {
                const { dispatch, dbApi } = await setupTestEnvironment({
                    masterKeyBase64,
                    existingUserId: userId,
                });

                try {
                    // Create space
                    console.log('Creating test space');
                    testSpaceId = newSpaceId();
                    const space = createTestSpace({ id: testSpaceId });
                    dispatch(addSpace(space));
                    dispatch(pushSpaceRequest({ id: testSpaceId }));

                    // Create attachment with markdown content
                    console.log('Creating test attachment with markdown content');
                    testAttachmentContent = '# Project Document\n\nThis is a project file with important content.';
                    testAttachmentFilename = 'project-doc.md';
                    const blob = new Blob([testAttachmentContent], { type: 'text/markdown' });
                    const file = new File([blob], testAttachmentFilename, { type: 'text/markdown' });

                    testAttachmentId = newAttachmentId();
                    const attachment = {
                        id: testAttachmentId,
                        spaceId: testSpaceId,
                        mimeType: file.type,
                        uploadedAt: new Date().toISOString(),
                        rawBytes: file.size,
                        processing: false,
                        filename: file.name,
                        data: new Uint8Array(await file.arrayBuffer()),
                        markdown: testAttachmentContent,
                    };

                    dispatch(upsertAttachment(attachment));
                    dispatch(pushAttachmentRequest({ id: testAttachmentId }));

                    // Wait for everything to sync to server
                    console.log('Waiting for space to sync to server');
                    await waitForSpaceSyncWithServer(dbApi, testSpaceId);

                    console.log('Waiting for attachment to sync to server');
                    await waitForAttachmentSyncWithServer(dbApi, testAttachmentId);

                    // Verify everything is persisted in session 1
                    console.log('Verifying space is persisted in session 1');
                    const persistedSpace = await dbApi.getSpaceById(testSpaceId);
                    expect(persistedSpace).toBeDefined();
                    expect(persistedSpace!.wrappedSpaceKey).toBeDefined();

                    console.log('Verifying attachment is persisted in session 1');
                    const persistedAttachment = await dbApi.getAttachmentById(testAttachmentId);
                    expect(persistedAttachment).toBeDefined();
                    expect(persistedAttachment!.encrypted).toBeDefined();
                } finally {
                    dispatch(stopRootSaga());
                }
            }

            // Session 2 (Tab 2): Fresh session, pull space by ID (simulating direct URL navigation)
            console.log('Session 2: Fresh session - pulling space by ID');
            {
                const { store, dispatch, dbApi, select } = await setupTestEnvironment({
                    masterKeyBase64,
                    existingUserId: userId,
                    // Don't pass existingDbApi - this simulates opening URL in a fresh tab
                });

                try {
                    // This simulates what ProjectDetailView does when opening a URL directly
                    console.log('Dispatching pullSpaceRequest (simulating direct URL navigation)');
                    dispatch(pullSpaceRequest({ id: testSpaceId }));

                    // Wait for space to appear in Redux
                    console.log('Waiting for space to appear in Redux');
                    await waitForCondition(
                        async () => {
                            const state = store.getState();
                            return state.spaces[testSpaceId] !== undefined;
                        },
                        { message: 'Waiting for space to be loaded from server' }
                    );

                    // Verify space is in Redux with correct data
                    console.log('Verifying space is in Redux');
                    const reduxSpace = store.getState().spaces[testSpaceId];
                    expect(reduxSpace).toBeDefined();
                    expect(reduxSpace.id).toBe(testSpaceId);
                    expect(reduxSpace.spaceKey).toBeDefined();

                    // Wait for space to appear in IndexedDB (non-dirty)
                    console.log('Waiting for space to sync to IndexedDB');
                    await waitForSpaceSyncWithServer(dbApi, testSpaceId);

                    // Verify space is in IndexedDB
                    console.log('Verifying space is in IndexedDB');
                    const idbSpace = await dbApi.getSpaceById(testSpaceId);
                    expect(idbSpace).toBeDefined();
                    expect(idbSpace!.id).toBe(testSpaceId);
                    expect(idbSpace!.wrappedSpaceKey).toBeDefined();
                    expect(idbSpace!.encrypted).toBeDefined();
                    expect(idbSpace!.dirty).toBeFalsy();

                    // Verify remote ID mapping exists for space
                    console.log('Verifying space remote ID mapping');
                    const spaceRemoteId = await dbApi.getRemoteIdFromLocalId('space', testSpaceId);
                    expect(spaceRemoteId).toBeDefined();

                    // Wait for attachment to appear in Redux (should be auto-populated with space)
                    console.log('Waiting for attachment to appear in Redux');
                    await waitForCondition(
                        async () => {
                            const att = select(selectAttachmentById(testAttachmentId));
                            return att !== undefined;
                        },
                        { message: 'Waiting for attachment to be loaded with space' }
                    );

                    // Verify attachment is in Redux (at least shallow initially)
                    console.log('Verifying attachment is in Redux');
                    const reduxAttachment = select(selectAttachmentById(testAttachmentId));
                    expect(reduxAttachment).toBeDefined();
                    expect(reduxAttachment!.id).toBe(testAttachmentId);
                    expect(reduxAttachment!.spaceId).toBe(testSpaceId);
                    expect(reduxAttachment!.filename).toBe(testAttachmentFilename);

                    // Wait for full attachment data to be available in IndexedDB
                    console.log('Waiting for full attachment to be available in IndexedDB');
                    const fullAttachment = await waitForValue(
                        async () => {
                            const attachment = await dbApi.getAttachmentById(testAttachmentId);
                            // The attachment should have encrypted data, indicating it's fully persisted
                            return attachment?.encrypted ? attachment : undefined;
                        },
                        {
                            message: 'Waiting for full attachment with encrypted data to be available in IndexedDB',
                            timeout: 10000,
                            pollInterval: 500,
                        }
                    );

                    // Verify the full attachment data is correctly persisted in IDB
                    console.log('Verifying full attachment data is in IndexedDB');
                    expect(fullAttachment).toBeDefined();
                    expect(fullAttachment!.id).toBe(testAttachmentId);
                    expect(fullAttachment!.mimeType).toBe('text/markdown');
                    expect(fullAttachment!.spaceId).toBe(testSpaceId);
                    expect(fullAttachment!.encrypted).toBeDefined();
                    expect(fullAttachment!.dirty).toBeFalsy();

                    // Verify remote ID mapping exists for attachment
                    console.log('Verifying attachment remote ID mapping');
                    const attachmentRemoteId = await dbApi.getRemoteIdFromLocalId('attachment', testAttachmentId);
                    expect(attachmentRemoteId).toBeDefined();

                    // Decrypt and verify attachment content matches
                    console.log('Verifying attachment can be decrypted with correct content');
                    const space = store.getState().spaces[testSpaceId];
                    const spaceDek = await getSpaceDek(space);
                    const decryptedAttachment = await deserializeAttachment(fullAttachment!, spaceDek);
                    expect(decryptedAttachment).toBeDefined();
                    expect(decryptedAttachment!.filename).toBe(testAttachmentFilename);
                    expect(decryptedAttachment!.markdown).toBe(testAttachmentContent);

                    // Wait for the full attachment (with markdown) to be in Redux
                    console.log('Waiting for attachment with full markdown content in Redux');
                    await waitForCondition(
                        async () => {
                            const att = select(selectAttachmentById(testAttachmentId));
                            return att?.markdown === testAttachmentContent;
                        },
                        { message: 'Waiting for full attachment content to appear in Redux' }
                    );

                    // Final verification: attachment data is in Redux with full content
                    console.log('Verifying attachment data is in Redux with full content');
                    const finalReduxAttachment = select(selectAttachmentById(testAttachmentId));
                    expect(finalReduxAttachment).toBeDefined();
                    expect(finalReduxAttachment!.markdown).toBe(testAttachmentContent);

                    console.log('Test completed successfully - space and attachment fully synced in fresh session!');
                } finally {
                    dispatch(stopRootSaga());
                }
            }
        }, 30000);
    });
});
