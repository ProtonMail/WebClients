import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { useRoomContext } from '@livekit/components-react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import type { MeetState } from '@proton/meet/store/rootReducer';
import {
    addChatMessages,
    chatAndReactionsReducer,
    selectChatMessages,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetCoreClientContext } from '../../contexts/MeetCoreClientContext';
import type { ChatComposeResultData, MeetCoreClient } from '../../wasm/MeetCoreClient';
import { useChatMessage } from './useChatMessage';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: vi.fn().mockReturnValue({ reportMeetError: vi.fn() }),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({ createNotification: vi.fn() }),
}));

// Resolve retry delays immediately so retry attempts don't incur real waits.
vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: vi.fn().mockResolvedValue(undefined),
}));

const LOCAL = 'local-participant';

const createMockRoom = () => ({
    localParticipant: {
        identity: LOCAL,
        publishData: vi.fn().mockResolvedValue(undefined),
    },
});

const createMeetCoreClient = (overrides: Partial<MeetCoreClient> = {}): MeetCoreClient =>
    ({
        composeChatMessage: vi.fn(),
        encryptMessage: vi.fn(),
        ...overrides,
    }) as unknown as MeetCoreClient;

const createStore = () =>
    configureStore({
        reducer: { ...chatAndReactionsReducer, ...uiStateReducer },
    });

type TestStore = ReturnType<typeof createStore>;

// The test store only wires up the reducers useChatMessage touches, so cast its partial state for the full-state selectors.
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

const composeResult = (overrides: Partial<ChatComposeResultData['local_echo']> = {}): ChatComposeResultData =>
    ({
        payload: new Uint8Array([1, 2, 3]),
        local_echo: {
            id: 'echo-1',
            text: 'Hello',
            received_at_ms: 1_000n,
            ...overrides,
        },
    }) as unknown as ChatComposeResultData;

describe('useChatMessage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendMessage - new chat handling', () => {
        beforeEach(() => {
            useFlagMock.mockReturnValue(true);
        });

        it('should compose, optimistically add, publish and mark the message as sent', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const composeChatMessage = vi.fn().mockResolvedValue(composeResult());
            const client = createMeetCoreClient({ composeChatMessage });

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            let returnValue: boolean | undefined;
            await act(async () => {
                returnValue = await result.current.sendMessage('Hello');
            });

            expect(returnValue).toBe(true);
            expect(composeChatMessage).toHaveBeenCalledWith('Hello', undefined, undefined);
            expect(room.localParticipant.publishData).toHaveBeenCalledWith(expect.any(Uint8Array), { reliable: true });

            expect(getMessages(store)).toEqual([
                expect.objectContaining({
                    id: 'echo-1',
                    message: 'Hello',
                    identity: LOCAL,
                    seen: true,
                    type: 'message',
                    status: 'sent',
                }),
            ]);
        });

        it('should retry publishing and mark the message as sent once publishing succeeds', async () => {
            const room = createMockRoom();
            room.localParticipant.publishData = vi
                .fn()
                .mockRejectedValueOnce(new Error('network'))
                .mockRejectedValueOnce(new Error('network'))
                .mockResolvedValue(undefined);
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const composeChatMessage = vi.fn().mockResolvedValue(composeResult());
            const client = createMeetCoreClient({ composeChatMessage });

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            let returnValue: boolean | undefined;
            await act(async () => {
                returnValue = await result.current.sendMessage('Hello');
            });

            expect(returnValue).toBe(true);
            expect(room.localParticipant.publishData).toHaveBeenCalledTimes(3);
            expect(getMessages(store)[0]).toEqual(expect.objectContaining({ id: 'echo-1', status: 'sent' }));
        });

        it('should mark the message as failed when publishing fails on every attempt', async () => {
            const room = createMockRoom();
            room.localParticipant.publishData = vi.fn().mockRejectedValue(new Error('network'));
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const composeChatMessage = vi.fn().mockResolvedValue(composeResult());
            const client = createMeetCoreClient({ composeChatMessage });

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            await act(async () => {
                await result.current.sendMessage('Hello');
            });

            expect(room.localParticipant.publishData).toHaveBeenCalledTimes(3);
            expect(getMessages(store)[0]).toEqual(expect.objectContaining({ id: 'echo-1', status: 'failed' }));
        });

        it('should pass reply options to compose and the optimistic message', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const composeChatMessage = vi
                .fn()
                .mockResolvedValue(composeResult({ in_reply_to_id: 'msg-1', topic_id: 'msg-1' }));
            const client = createMeetCoreClient({ composeChatMessage });

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            await act(async () => {
                await result.current.sendMessage('Hello', { replyToId: 'msg-1', topicId: 'msg-1' });
            });

            expect(composeChatMessage).toHaveBeenCalledWith('Hello', 'msg-1', 'msg-1');
            expect(getMessages(store)[0]).toEqual(expect.objectContaining({ inReplyToId: 'msg-1', topicId: 'msg-1' }));
        });
    });

    describe('sendMessage - legacy chat handling', () => {
        beforeEach(() => {
            useFlagMock.mockReturnValue(false);
        });

        it('should encrypt, publish and add the plaintext message to the store', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const encryptMessage = vi.fn().mockResolvedValue(new Uint8Array([9, 9, 9]));
            const client = createMeetCoreClient({ encryptMessage });

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            let returnValue: boolean | undefined;
            await act(async () => {
                returnValue = await result.current.sendMessage('Hello');
            });

            expect(returnValue).toBe(true);
            expect(encryptMessage).toHaveBeenCalledWith('Hello');
            expect(room.localParticipant.publishData).toHaveBeenCalledWith(expect.any(Uint8Array), { reliable: true });

            expect(getMessages(store)).toEqual([
                expect.objectContaining({
                    message: 'Hello',
                    identity: LOCAL,
                    seen: true,
                    type: 'message',
                }),
            ]);
        });
    });

    describe('retryMessage', () => {
        beforeEach(() => {
            useFlagMock.mockReturnValue(true);
        });

        it('should remove the existing message and re-send it', async () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            const composeChatMessage = vi.fn().mockResolvedValue(composeResult({ id: 'echo-2' }));
            const client = createMeetCoreClient({ composeChatMessage });

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            await act(async () => {
                await result.current.retryMessage({
                    id: 'failed-1',
                    identity: LOCAL,
                    message: 'Retry me',
                    timestamp: 1_000,
                    status: 'failed',
                });
            });

            expect(composeChatMessage).toHaveBeenCalledWith('Retry me', undefined, undefined);
            const messages = getMessages(store);
            expect(messages.find((m) => m.id === 'failed-1')).toBeUndefined();
            expect(messages.find((m) => m.id === 'echo-2')).toBeDefined();
        });
    });

    describe('discardMessage', () => {
        beforeEach(() => {
            useFlagMock.mockReturnValue(true);
        });

        it('should remove the message from the store', () => {
            const room = createMockRoom();
            useRoomContextMock.mockReturnValue(room);

            const store = createStore();
            store.dispatch(addChatMessages([{ id: 'msg-1', identity: LOCAL, message: 'Bye', timestamp: 1_000 }]));
            const client = createMeetCoreClient();

            const { result } = renderHook(() => useChatMessage(), { wrapper: createWrapper(store, client) });

            act(() => {
                result.current.discardMessage('msg-1');
            });

            expect(getMessages(store).find((m) => m.id === 'msg-1')).toBeUndefined();
        });
    });
});
