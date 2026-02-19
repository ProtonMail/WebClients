import type { AnyAction, Middleware } from '@reduxjs/toolkit';
import { createMemoryHistory } from 'history';
import createSagaMiddleware from 'redux-saga';
import { v4 as uuidv4 } from 'uuid';

import * as bootstrap from '@proton/account/bootstrap';
import { createUnleash } from '@proton/account/bootstrap';
import { KEY_LENGTH_BYTES } from '@proton/crypto/lib/subtle/aesGcm';
import createApi from '@proton/shared/lib/api/createApi';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { ProtonConfig, User } from '@proton/shared/lib/interfaces';

import { base64ToMasterKey, generateMasterKeyBase64, generateSpaceKeyBase64 } from '../../crypto';
import type { AesKwCryptoKey } from '../../crypto/types';
import { DbApi } from '../../indexedDb/db';
import { createLumoListenerMiddleware } from '../../redux/listeners';
import { rootSaga } from '../../redux/sagas';
import type { LumoSelector } from '../../redux/selectors';
import { addConversation, newConversationId, pushConversationRequest } from '../../redux/slices/core/conversations';
import { addMasterKey } from '../../redux/slices/core/credentials';
import { addMessage, finishMessage, newMessageId, pushMessageRequest } from '../../redux/slices/core/messages';
import { addSpace, newSpaceId, pushSpaceRequest } from '../../redux/slices/core/spaces';
import type { LumoDispatch, LumoSaga, LumoSagaContext } from '../../redux/store';
import { LumoApi } from '../../remote/api';
import type { RemoteId } from '../../remote/types';
import { serializeSpace } from '../../serialization';
import type { AttachmentId } from '../../types';
import {
    type Base64,
    type Conversation,
    type ConversationId,
    ConversationStatus,
    type Message,
    type MessageId,
    Role,
    type Space,
    type SpaceId,
    type Status,
    cleanConversation,
    cleanMessage,
    cleanSpace,
} from '../../types';
import { sleep } from '../../util/date';
import type { MockDatabase, MockDbSpace } from './mock-server';

export const USER_TEST_UID = 'test-uid';

export type WaitOpts = { timeout?: number; pollInterval?: number; message?: string };

// Action history tracker for testing action dispatches
export interface ActionHistoryTracker {
    actions: AnyAction[];
    clear: () => void;
    findAction: (actionType: string) => AnyAction | undefined;
    hasAction: (actionType: string) => boolean;
}

export function createActionHistoryTracker(): ActionHistoryTracker {
    const actions: AnyAction[] = [];

    return {
        actions,
        clear: () => (actions.length = 0),
        findAction: (actionType: string) => actions.find((action) => action.type === actionType),
        hasAction: (actionType: string) => actions.some((action) => action.type === actionType),
    };
}

export function createActionHistoryMiddleware(tracker: ActionHistoryTracker): Middleware {
    return (_store) => (next) => (action) => {
        tracker.actions.push(action as AnyAction);
        return next(action);
    };
}

// Generic polling helper that waits for a condition to be met
export async function waitForCondition(checkFn: () => Promise<boolean>, opts?: WaitOpts): Promise<void> {
    const timeout = opts?.timeout ?? 10000;
    const pollInterval = opts?.pollInterval ?? 500;
    const message = opts?.message;

    const startTime = Date.now();
    while (!(await checkFn()) && Date.now() - startTime < timeout) {
        if (message) console.log(message);
        await sleep(pollInterval);
    }

    if (!(await checkFn())) {
        if (message) {
            throw new Error(`${message}: Timed out after ${timeout}ms`);
        } else {
            throw new Error(`Timed out after ${timeout}ms waiting for condition to`);
        }
    }
}

// Generic polling helper that waits for a condition to be met
export async function waitForValue<T>(checkFn: () => Promise<T | undefined>, opts?: WaitOpts): Promise<NonNullable<T>> {
    const timeout = opts?.timeout ?? 10000;
    const pollInterval = opts?.pollInterval ?? 500;
    const message = opts?.message;

    const startTime = Date.now();
    let result: T | undefined;
    while (result === undefined && Date.now() - startTime < timeout) {
        if (message) console.log(message);
        result = await checkFn();
        if (!result) {
            await sleep(pollInterval);
        }
    }

    if (!result) {
        if (message) {
            throw new Error(`${message}: Timed out after ${timeout}ms`);
        } else {
            throw new Error(`Timed out after ${timeout}ms waiting for value`);
        }
    }

    return result as NonNullable<T>;
}

export function fixedMasterKeyBytes() {
    return new Uint8Array(KEY_LENGTH_BYTES).fill(42);
}

export function generateFakeUserId() {
    return `userId-${uuidv4()}`;
}

// Test-specific store setup with action history middleware
function createTestStore({
    preloadedState,
    listenerMiddleware,
    sagaMiddleware,
    actionHistoryMiddleware,
    extraThunkArguments,
}: {
    preloadedState?: Partial<any>;
    listenerMiddleware: any;
    sagaMiddleware?: any;
    actionHistoryMiddleware: any;
    extraThunkArguments: any;
}) {
    const { configureStore } = require('@reduxjs/toolkit');
    const { rootReducer } = require('../../redux/rootReducer');
    const { start } = require('../../redux/listeners');

    const isDevMode = process.env.NODE_ENV !== 'production';
    const isTest = process.env.NODE_ENV === 'test';

    const store = configureStore({
        preloadedState,
        reducer: rootReducer,
        devTools: isDevMode,
        middleware: (getDefaultMiddleware: any) => {
            const m1 = getDefaultMiddleware({
                serializableCheck: false, // Simplified for tests
                immutableCheck: isDevMode && !isTest,
                thunk: { extraArgument: extraThunkArguments },
            });
            const m2 = m1.prepend(listenerMiddleware.middleware);
            const m3 = sagaMiddleware ? m2.concat(sagaMiddleware) : m2;
            const m4 = m3.concat(actionHistoryMiddleware);
            return m4;
        },
    });

    const startListening = listenerMiddleware.startListening;
    start(startListening);

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
}

// Helper function to setup test environment
export async function setupTestEnvironment({
    preloadedState,
    masterKeyBase64,
    existingDbApi,
    existingUserId,
}: {
    preloadedState?: object;
    masterKeyBase64?: Base64;
    existingDbApi?: DbApi;
    existingUserId?: string;
} = {}) {
    masterKeyBase64 ??= generateMasterKeyBase64();
    const masterKey = await base64ToMasterKey(masterKeyBase64);

    const userId = existingUserId || generateFakeUserId();
    const mockUser = { ID: userId } as User;
    const testConfig: ProtonConfig = {
        APP_VERSION: '5.0.999.999',
        APP_NAME: 'proton-lumo',
        API_URL: 'http://localhost',
        COMMIT: 'test-commit',
        DATE_VERSION: 'test-date',
        BRANCH: 'main',
        SENTRY_DSN: '',
        VERSION_PATH: '',
        CLIENT_TYPE: 1,
        CLIENT_SECRET: 'test-secret',
        LOCALES: {},
        SSO_URL: '',
        LOGICAL_SCSS: true,
    };

    const api = createApi({ config: testConfig });
    const authentication = bootstrap.createAuthentication();
    authentication.setPersistent(false);
    const history = createMemoryHistory();
    const eventManager = {} as EventManager<any>;
    const unleashClient = createUnleash({ api });

    const lumoApi = new LumoApi(USER_TEST_UID);
    const dbApi = existingDbApi || new DbApi(mockUser.ID);
    if (!existingDbApi) {
        await dbApi.initialize();
    }

    const extra = {
        config: testConfig,
        api,
        authentication,
        history,
        eventManager,
        unleashClient,
        dbApi,
        lumoApi,
    };

    const listenerMiddleware = createLumoListenerMiddleware({ extra });

    const sagaMiddleware: LumoSaga = createSagaMiddleware<LumoSagaContext>({
        context: { dbApi, lumoApi } as LumoSagaContext,
    });

    // Create action history tracker for testing
    const actionHistory = createActionHistoryTracker();
    const actionHistoryMiddleware = createActionHistoryMiddleware(actionHistory);

    // Create store with action history middleware for testing
    const store = createTestStore({
        listenerMiddleware,
        preloadedState: preloadedState ?? {},
        sagaMiddleware,
        actionHistoryMiddleware,
        extraThunkArguments: extra,
    });
    const dispatch = store.dispatch;

    sagaMiddleware.run(rootSaga, { crashIfErrors: true });

    dispatch(addMasterKey(masterKeyBase64));

    const select = <T>(selector: LumoSelector<T>) => selector(store.getState());

    // Wait a bit to ensure db is setup
    await sleep(100);

    return {
        store,
        dispatch,
        masterKeyBase64,
        mockUser,
        lumoApi,
        dbApi,
        masterKey,
        userId,
        select,
        actionHistory,
    };
}

export interface TestData {
    spaces: Space[];
    conversations: Conversation[];
    messages: Message[];
}

export function createTestData({
    numSpaces = 3,
    numConversationsPerSpace = 2,
    numMessagesPerConversation = 3,
} = {}): TestData {
    const spaces: Space[] = [];
    const conversations: Conversation[] = [];
    const messages: Message[] = [];

    for (let i = 0; i < numSpaces; i++) {
        const spaceId = newSpaceId();
        const space = createTestSpace({ id: spaceId });
        spaces.push(space);

        for (let j = 0; j < numConversationsPerSpace; j++) {
            const conversation = createTestConversation(spaceId, { title: `Conversation ${j + 1} in Space ${i + 1}` });
            conversations.push(conversation);

            for (let k = 0; k < numMessagesPerConversation; k++) {
                // Create alternating user and assistant messages
                const role = k % 2 === 0 ? Role.User : Role.Assistant;
                const message = createTestMessage(conversation.id, role, {
                    content: `Message ${k + 1} in Conversation ${j + 1}, Space ${i + 1}`,
                });
                messages.push(message);
            }
        }
    }

    return { spaces, conversations, messages };
}

export function addTestDataToStore(testData: TestData) {
    return async (dispatch: LumoDispatch) => {
        // Add spaces
        for (const space of testData.spaces) {
            dispatch(addSpace(space));
            dispatch(pushSpaceRequest({ id: space.id }));
        }

        // Add conversations
        for (const conversation of testData.conversations) {
            dispatch(addConversation(conversation));
            dispatch(pushConversationRequest({ id: conversation.id }));
        }

        // Add messages
        for (const message of testData.messages) {
            dispatch(addMessage(message));
            dispatch(
                finishMessage({
                    messageId: message.id,
                    conversationId: message.conversationId,
                    spaceId: testData.conversations.find((c) => c.id === message.conversationId)!.spaceId,
                    content: message.content!,
                    status: message.status!,
                    role: message.role,
                })
            );
            dispatch(pushMessageRequest({ id: message.id }));
        }
    };
}

export async function waitForSpaceSyncWithServer(dbApi: DbApi, spaceId: string, opts?: WaitOpts) {
    const opts1 = opts ?? {};
    opts1.message ??= `waiting for space ${spaceId} to become non-dirty`;
    await waitForCondition(async () => {
        const space = await dbApi.getSpaceById(spaceId);
        console.log(`waiting for space ${spaceId} to become non-dirty, got: `, space);
        return space !== undefined && !space.dirty;
    }, opts1);
}

export async function waitForConversationSyncWithServer(dbApi: DbApi, conversationId: string, opts?: WaitOpts) {
    const opts1 = opts ?? {};
    opts1.message ??= `waiting for conversation ${conversationId} to become non-dirty`;
    await waitForCondition(async () => {
        const conversation = await dbApi.getConversationById(conversationId);
        console.log(`waiting for conversation ${conversationId} to become non-dirty, got: `, conversation);
        return conversation !== undefined && !conversation.dirty;
    }, opts1);
}

export async function waitForMessageSyncWithServer(dbApi: DbApi, messageId: MessageId, opts?: WaitOpts) {
    const opts1 = opts ?? {};
    opts1.message ??= `waiting for message ${messageId} to become non-dirty`;
    await waitForCondition(async () => {
        const message = await dbApi.getMessageById(messageId);
        console.log(`waiting for message ${messageId} to become non-dirty, got: `, message);
        return message !== undefined && !message.dirty;
    }, opts1);
}

export async function waitForAttachmentSyncWithServer(dbApi: DbApi, attachmentId: AttachmentId, opts?: WaitOpts) {
    const opts1 = opts ?? {};
    opts1.message ??= `waiting for attachment ${attachmentId} to become non-dirty`;
    await waitForCondition(async () => {
        const attachment = await dbApi.getAttachmentById(attachmentId);
        console.log(`waiting for attachment ${attachmentId} to become non-dirty, got: `, attachment);
        return attachment !== undefined && !attachment.dirty;
    }, opts1);
}

export async function generateTestSpacesOnMockServer(count: number, masterKey: AesKwCryptoKey, mockDb: MockDatabase) {
    type SpaceWithRemoteId = Space & { remoteId: RemoteId };
    const spaces: SpaceWithRemoteId[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const spaceId = newSpaceId();
        const timestamp = new Date(now.getTime() - i * 1000).toISOString();
        const space: Space = {
            id: spaceId,
            createdAt: timestamp, // Each space 1 second apart
            updatedAt: timestamp,
            spaceKey: generateSpaceKeyBase64(),
        };

        // Serialize the space for the mock DB
        const serializedSpace = await serializeSpace(space, masterKey);
        if (!serializedSpace) {
            throw new Error(`Failed to serialize space ${spaceId}`);
        }

        // Add to mock DB
        const remoteId = await mockDb.getNextSpaceId();
        const mockSpace: MockDbSpace = {
            ID: remoteId,
            CreateTime: serializedSpace.createdAt,
            UpdateTime: serializedSpace.updatedAt,
            SpaceKey: serializedSpace.wrappedSpaceKey!,
            SpaceTag: spaceId,
            Encrypted: serializedSpace.encrypted as Base64,
        };
        mockDb.addSpace(mockSpace);
        spaces.push({ ...space, remoteId });
    }
    return spaces;
}

// Helper functions for creating test objects
export function createTestSpace(overrides: Partial<Space> = {}): Space {
    const now = new Date().toISOString();
    return {
        id: newSpaceId(),
        createdAt: now,
        updatedAt: now,
        spaceKey: generateSpaceKeyBase64(),
        ...overrides,
    };
}

export function createTestConversation(spaceId: SpaceId, overrides: Partial<Conversation> = {}): Conversation {
    const now = new Date().toISOString();
    return {
        id: newConversationId(),
        spaceId,
        createdAt: now,
        updatedAt: now,
        title: 'Test Conversation',
        status: ConversationStatus.COMPLETED,
        ...overrides,
    };
}

export function createTestMessage(
    conversationId: ConversationId,
    role: Role,
    overrides: Partial<Message> = {}
): Message {
    return {
        id: newMessageId(),
        conversationId,
        createdAt: new Date().toISOString(),
        role,
        status: 'succeeded' as Status,
        content: 'Test message content',
        ...overrides,
    };
}

export const expectSpaceEqual = (space1: Space, space2: Space, opts: { ignoreFields?: (keyof Space)[] } = {}) => {
    const ignoreFields = opts.ignoreFields ?? [];
    const clean1 = cleanSpace(space1);
    const clean2 = cleanSpace(space2);
    for (const f of ignoreFields) {
        delete clean1[f];
        delete clean2[f];
    }
    expect(clean1).toStrictEqual(clean2);
};

export const expectConversationEqual = (
    conversation1: Conversation,
    conversation2: Conversation,
    opts: { ignoreFields?: (keyof Conversation)[] } = {}
) => {
    const ignoreFields = opts.ignoreFields ?? [];
    const clean1 = cleanConversation(conversation1);
    const clean2 = cleanConversation(conversation2);
    for (const f of ignoreFields) {
        delete clean1[f];
        delete clean2[f];
    }
    expect(clean1).toStrictEqual(clean2);
};

export const expectMessageEqual = (
    message1: Message,
    message2: Message,
    opts: { ignoreFields?: (keyof Message)[] } = {}
) => {
    const ignoreFields = opts.ignoreFields ?? [];
    const clean1 = cleanMessage(message1);
    const clean2 = cleanMessage(message2);
    for (const f of ignoreFields) {
        delete clean1[f];
        delete clean2[f];
    }
    expect(clean1).toStrictEqual(clean2);
};
