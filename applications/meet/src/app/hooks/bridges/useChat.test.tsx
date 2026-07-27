import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { useRoomContext } from '@livekit/components-react';
import { ChatEventKind } from '@proton-meet/proton-meet-core';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import type { RemoteParticipant } from 'livekit-client';
import type { Mock } from 'vitest';

import type { MeetState } from '@proton/meet/store/rootReducer';
import {
    addChatMessages,
    chatAndReactionsReducer,
    selectChatMessages,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { MeetingSideBars, toggleSideBarState, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetCoreClientContext } from '../../contexts/MeetCoreClientContext';
import { addSpecialCharactersForMessageDisplay } from '../../utils/addSpecialCharactersForMessageDisplay';
import type { ChatIncomingEventInfoData, MeetCoreClient } from '../../wasm/MeetCoreClient';
import { useChat } from './useChat';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: vi.fn().mockReturnValue({ reportMeetError: vi.fn() }),
}));

// Resolve retry delays immediately so retry attempts don't incur real waits.
vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: vi.fn().mockResolvedValue(undefined),
}));

const SENDER = 'sender-participant';

// Minimal mock of the LiveKit room: useChat only subscribes/unsubscribes to `dataReceived`.
const createMockRoom = () => ({
    on: vi.fn(),
    off: vi.fn(),
});

// Minimal mock of the wasm core client: only the decode/decrypt methods useChat calls are stubbed.
const createMeetCoreClient = (overrides: Partial<MeetCoreClient> = {}): MeetCoreClient =>
    ({
        decodeChat: vi.fn(),
        decryptMessage: vi.fn(),
        ...overrides,
    }) as unknown as MeetCoreClient;

const createStore = () =>
    configureStore({
        reducer: { ...chatAndReactionsReducer, ...uiStateReducer },
    });

type TestStore = ReturnType<typeof createStore>;

// The test store only wires up the reducers useChat touches, so cast its partial state for the full-state selectors.
const getMessages = (store: TestStore) => selectChatMessages(store.getState() as unknown as MeetState);

const createWrapper = (store: TestStore, client: MeetCoreClient) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                <MeetCoreClientContext.Provider value={client}>{children}</MeetCoreClientContext.Provider>
            </Provider>
        );
    };

const useRoomContextMock = useRoomContext as Mock;
const useFlagMock = useFlag as Mock;

const getDataReceivedHandler = (room: ReturnType<typeof createMockRoom>) =>
    room.on.mock.calls.find((call) => call[0] === 'dataReceived')?.[1] as (
        // Matches LiveKit's payload typing used by the hook under test
        // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
        payload: Uint8Array,
        participant?: RemoteParticipant
    ) => Promise<void>;

const encode = (value: object) => new TextEncoder().encode(JSON.stringify(value));

const participant = { identity: SENDER } as RemoteParticipant;

describe('useChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should subscribe to dataReceived on mount and unsubscribe on unmount', () => {
        const room = createMockRoom();
        useRoomContextMock.mockReturnValue(room);
        useFlagMock.mockReturnValue(true);

        const store = createStore();
        const client = createMeetCoreClient();

        const { unmount } = renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

        expect(room.on).toHaveBeenCalledWith('dataReceived', expect.any(Function));

        const handler = getDataReceivedHandler(room);
        unmount();

        expect(room.off).toHaveBeenCalledWith('dataReceived', handler);
    });

    describe('new chat handling', () => {
        beforeEach(() => {
            useFlagMock.mockReturnValue(true);
        });

        it('should add an incoming chat message to the store', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const event: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Message,
                id: 'msg-1',
                sender_participant_id: SENDER,
                received_at_ms: 1_000n,
                text: 'Hello world',
            } as ChatIncomingEventInfoData;

            const store = createStore();
            const client = createMeetCoreClient({ decodeChat: vi.fn().mockResolvedValue(event) });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
            });

            expect(getMessages(store)).toEqual([
                expect.objectContaining({
                    id: 'msg-1',
                    timestamp: 1_000,
                    identity: SENDER,
                    seen: false,
                    message: 'Hello world',
                    type: 'message',
                }),
            ]);
        });

        it('should store an incoming message inert and decode it back for display', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const receivedText = 'a < b & <test';

            const event: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Message,
                id: 'msg-1',
                sender_participant_id: SENDER,
                received_at_ms: 1_000n,
                text: receivedText,
            } as ChatIncomingEventInfoData;

            const store = createStore();
            const client = createMeetCoreClient({ decodeChat: vi.fn().mockResolvedValue(event) });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
            });

            const storedMessage = getMessages(store)[0].message;
            expect(storedMessage).toBe('a &lt; b &amp; &lt;test');
            expect(storedMessage).not.toMatch(/[<>]/);
            expect(addSpecialCharactersForMessageDisplay(storedMessage)).toBe(receivedText);
        });

        it('should mark the incoming message as seen when the chat sidebar is open', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const event: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Message,
                id: 'msg-1',
                sender_participant_id: SENDER,
                received_at_ms: 1_000n,
                text: 'Hello world',
            } as ChatIncomingEventInfoData;

            const store = createStore();
            store.dispatch(toggleSideBarState(MeetingSideBars.Chat));
            const client = createMeetCoreClient({ decodeChat: vi.fn().mockResolvedValue(event) });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
            });

            expect(getMessages(store)[0]).toEqual(expect.objectContaining({ seen: true }));
        });

        it('should add a reaction to an existing message', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const event: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Reaction,
                id: 'reaction-1',
                sender_participant_id: SENDER,
                received_at_ms: 2_000n,
                target_id: 'msg-1',
                emoji: '👍',
            } as ChatIncomingEventInfoData;

            const store = createStore();
            store.dispatch(addChatMessages([{ id: 'msg-1', identity: 'other', message: 'Hi', timestamp: 1_000 }]));
            const client = createMeetCoreClient({ decodeChat: vi.fn().mockResolvedValue(event) });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
            });

            const message = getMessages(store).find((m) => m.id === 'msg-1');
            expect(message?.reactions).toEqual({ '👍': [SENDER] });
        });

        it('should retry decoding and add the message once decoding succeeds', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const event: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Message,
                id: 'msg-1',
                sender_participant_id: SENDER,
                received_at_ms: 1_000n,
                text: 'Hello world',
            } as ChatIncomingEventInfoData;

            const store = createStore();
            const decodeChat = vi
                .fn()
                .mockRejectedValueOnce(new Error('not ready'))
                .mockRejectedValueOnce(new Error('not ready'))
                .mockResolvedValue(event);
            const client = createMeetCoreClient({ decodeChat });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
            });

            expect(decodeChat).toHaveBeenCalledTimes(3);
            expect(getMessages(store)).toEqual([expect.objectContaining({ id: 'msg-1', message: 'Hello world' })]);
        });

        it('should not add a message when decoding fails on every attempt', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const decodeChat = vi.fn().mockRejectedValue(new Error('not ready'));
            const client = createMeetCoreClient({ decodeChat });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
            });

            expect(decodeChat).toHaveBeenCalledTimes(3);
            expect(getMessages(store)).toEqual([]);
        });

        it('should remove a reaction for an unreact event', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const reactionEvent: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Reaction,
                id: 'reaction-1',
                sender_participant_id: SENDER,
                received_at_ms: 2_000n,
                target_id: 'msg-1',
                emoji: '👍',
            } as ChatIncomingEventInfoData;

            const unreactEvent: ChatIncomingEventInfoData = {
                kind: ChatEventKind.Reaction,
                id: 'reaction-2',
                sender_participant_id: SENDER,
                received_at_ms: 3_000n,
                replaces_id: 'reaction-1',
            } as ChatIncomingEventInfoData;

            const store = createStore();
            store.dispatch(addChatMessages([{ id: 'msg-1', identity: 'other', message: 'Hi', timestamp: 1_000 }]));
            const decodeChat = vi.fn().mockResolvedValueOnce(reactionEvent).mockResolvedValueOnce(unreactEvent);
            const client = createMeetCoreClient({ decodeChat });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(encode({ type: 'message' }), participant);
                await handler(encode({ type: 'message' }), participant);
            });

            const message = getMessages(store).find((m) => m.id === 'msg-1');
            expect(message?.reactions).toEqual({});
        });
    });

    describe('legacy chat handling', () => {
        beforeEach(() => {
            useFlagMock.mockReturnValue(false);
        });

        it('should decrypt and add an incoming chat message to the store', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const client = createMeetCoreClient({
                decryptMessage: vi.fn().mockResolvedValue({ sender_participant_id: SENDER, message: 'Hi there' }),
            });

            renderHook(() => useChat(), { wrapper: createWrapper(store, client) });

            const handler = getDataReceivedHandler(room);

            await act(async () => {
                await handler(
                    encode({ type: 'message', id: `${SENDER}-123`, message: 'encrypted', timestamp: 5_000 }),
                    participant
                );
            });

            expect(getMessages(store)).toEqual([
                expect.objectContaining({
                    id: `${SENDER}-123`,
                    timestamp: 5_000,
                    identity: SENDER,
                    seen: false,
                    message: 'Hi there',
                    type: 'message',
                }),
            ]);
        });
    });
});
