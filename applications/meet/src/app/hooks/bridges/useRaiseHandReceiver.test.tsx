import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { useRoomContext } from '@livekit/components-react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import type { Participant, RemoteParticipant } from 'livekit-client';
import type { Mock } from 'vitest';

import type { MeetState } from '@proton/meet/store/rootReducer';
import {
    chatAndReactionsReducer,
    raiseHand,
    resetChatAndReactions,
    selectRaisedHands,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { connectionReducer, setJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { currentMeetingReducer, resetCurrentMeeting, setMlsGroupState } from '@proton/meet/store/slices/currentMeeting';
import { mergeParticipantsMap, participantsReducer } from '@proton/meet/store/slices/participants/participantsSlice';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetCoreClientContext } from '../../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../../types';
import type { DecryptedMessageInfoData, MeetCoreClient } from '../../wasm/MeetCoreClient';
import { useRaiseHandReceiver } from './useRaiseHandReceiver';

const { reportMeetError } = vi.hoisted(() => ({ reportMeetError: vi.fn() }));

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: vi.fn().mockResolvedValue(undefined),
}));

const LOCAL = 'local-participant';
const SENDER = 'sender-participant';
const ADMIN = 'admin-participant';
const NEWCOMER = 'newcomer-participant';

const createMockRoom = () => ({
    on: vi.fn(),
    off: vi.fn(),
    localParticipant: { identity: LOCAL, publishData: vi.fn().mockResolvedValue(undefined) },
});

const createMeetCoreClient = (decryptMessage: Mock) =>
    ({
        decryptMessage,
        encryptMessage: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }) as unknown as MeetCoreClient;

const createStore = () =>
    configureStore({
        reducer: { ...chatAndReactionsReducer, ...participantsReducer, ...connectionReducer, ...currentMeetingReducer },
    });

type TestStore = ReturnType<typeof createStore>;

const setEpoch = (store: TestStore, epoch: number) =>
    store.dispatch(setMlsGroupState({ displayCode: 'display-code', epoch, memberCount: 3 }));

const getRaisedHands = (store: TestStore) => selectRaisedHands(store.getState() as unknown as MeetState);

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

type RoomListener = (...args: unknown[]) => void;

const getListener = (room: ReturnType<typeof createMockRoom>, event: string) =>
    room.on.mock.calls.find((call) => call[0] === event)?.[1] as RoomListener;

const encodeEnvelope = (id: string) => new TextEncoder().encode(JSON.stringify({ id, message: 'encrypted' }));

const decryptedFrom = (sender: string, content: object): DecryptedMessageInfoData => ({
    sender_participant_id: sender,
    message: JSON.stringify(content),
});

const flushAsyncWork = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });

const renderReceiver = (decryptMessage: Mock, store = createStore()) => {
    const room = createMockRoom();
    useRoomContextMock.mockReturnValue(room);
    const client = createMeetCoreClient(decryptMessage);

    const { rerender, unmount } = renderHook(() => useRaiseHandReceiver(), {
        wrapper: createWrapper(store, client),
    });

    const receive = (sender: string, topic: PublishableDataTypes, envelopeId: string) =>
        getListener(room, 'dataReceived')(
            encodeEnvelope(envelopeId),
            { identity: sender } as RemoteParticipant,
            undefined,
            topic
        );

    return { room, store, client, receive, rerender, unmount };
};

const decryptOnceWhenReleased = () => {
    let release: (value: DecryptedMessageInfoData) => void = () => {};
    const decryptMessage = vi.fn().mockReturnValueOnce(
        new Promise<DecryptedMessageInfoData>((resolve) => {
            release = resolve;
        })
    );
    return { decryptMessage, release };
};

describe('useRaiseHandReceiver', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useFlagMock.mockReturnValue(true);
    });

    it('adds the sender to the raised hands when a raise is received', async () => {
        const decryptMessage = vi.fn().mockResolvedValue(decryptedFrom(SENDER, { raised: true }));
        const { store, receive } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([SENDER]);
    });

    it('retries a decrypt that throws and applies the raise without reporting it', async () => {
        const decryptMessage = vi
            .fn()
            .mockRejectedValueOnce(new Error('MLS group not ready'))
            .mockResolvedValue(decryptedFrom(SENDER, { raised: true }));
        const { store, receive } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();

        expect(decryptMessage).toHaveBeenCalledTimes(2);
        expect(getRaisedHands(store)).toEqual([SENDER]);
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('reports a raise that fails every decrypt attempt when nothing later from that sender was applied', async () => {
        const decryptMessage = vi.fn().mockRejectedValue(new Error('MLS epoch unknown'));
        const { store, receive } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();

        expect(decryptMessage).toHaveBeenCalledTimes(3);
        expect(getRaisedHands(store)).toEqual([]);
        expect(reportMeetError).toHaveBeenCalledTimes(1);
        expect(reportMeetError).toHaveBeenCalledWith('Failed to decrypt raise hand message', { level: 'error' });
    });

    it('does not report a raise that fails every decrypt attempt after a later raise from the same sender was applied', async () => {
        let rejectLastAttempt: (error: Error) => void = () => {};
        const decryptMessage = vi
            .fn()
            .mockRejectedValueOnce(new Error('MLS epoch unknown'))
            .mockRejectedValueOnce(new Error('MLS epoch unknown'))
            .mockReturnValueOnce(
                new Promise<DecryptedMessageInfoData>((_, reject) => {
                    rejectLastAttempt = reject;
                })
            )
            .mockResolvedValueOnce(decryptedFrom(SENDER, { raised: true }));
        const { store, receive } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();
        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-2`);
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([SENDER]);

        rejectLastAttempt(new Error('MLS epoch unknown'));
        await flushAsyncWork();

        expect(decryptMessage).toHaveBeenCalledTimes(4);
        expect(getRaisedHands(store)).toEqual([SENDER]);
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('keeps the hand lowered when an earlier raise finishes decrypting after a later lower', async () => {
        let resolveRaiseDecrypt: (value: DecryptedMessageInfoData) => void = () => {};
        const decryptMessage = vi
            .fn()
            .mockReturnValueOnce(
                new Promise<DecryptedMessageInfoData>((resolve) => {
                    resolveRaiseDecrypt = resolve;
                })
            )
            .mockResolvedValueOnce(decryptedFrom(SENDER, { raised: false }));
        const { store, receive } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-2`);
        await flushAsyncWork();

        resolveRaiseDecrypt(decryptedFrom(SENDER, { raised: true }));
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([]);
    });

    it('keeps the hands reset when a raise received before leaving the room finishes decrypting after it', async () => {
        const store = createStore();
        store.dispatch(setJoinedRoom(true));
        const { decryptMessage, release } = decryptOnceWhenReleased();
        decryptMessage.mockResolvedValue(decryptedFrom(SENDER, { raised: true }));
        const { receive } = renderReceiver(decryptMessage, store);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();

        await act(async () => {
            store.dispatch(setJoinedRoom(false));
            store.dispatch(resetChatAndReactions());
        });
        release(decryptedFrom(SENDER, { raised: true }));
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([]);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-2`);
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([SENDER]);
    });

    it('drops a raise that finishes decrypting after the receiver re-subscribed', async () => {
        const { decryptMessage, release } = decryptOnceWhenReleased();
        const { store, receive, rerender } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();

        useFlagMock.mockReturnValue(false);
        rerender();
        release(decryptedFrom(SENDER, { raised: true }));
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([]);
    });

    it('drops a raise that finishes decrypting after the receiver unmounted', async () => {
        const { decryptMessage, release } = decryptOnceWhenReleased();
        const { store, receive, unmount } = renderReceiver(decryptMessage);

        receive(SENDER, PublishableDataTypes.RaiseHand, `${SENDER}-1`);
        await flushAsyncWork();

        unmount();
        release(decryptedFrom(SENDER, { raised: true }));
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([]);
    });

    it('applies an admin lower once the sender loads as an admin', async () => {
        const store = createStore();
        store.dispatch(raiseHand(SENDER));
        const decryptMessage = vi.fn().mockResolvedValue(decryptedFrom(ADMIN, { identity: SENDER }));
        const { receive } = renderReceiver(decryptMessage, store);

        receive(ADMIN, PublishableDataTypes.LowerHandAdmin, `${SENDER}-1`);
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([SENDER]);

        await act(async () => {
            store.dispatch(
                mergeParticipantsMap({
                    [ADMIN]: {
                        ParticipantUUID: 'admin-uuid',
                        EncryptedDisplayName: '',
                        IsAdmin: ParticipantCapabilityPermission.Allowed,
                    },
                })
            );
        });
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([]);
    });

    it('ignores an admin lower from a sender who loads without admin or host rights', async () => {
        const store = createStore();
        store.dispatch(raiseHand(SENDER));
        const decryptMessage = vi.fn().mockResolvedValue(decryptedFrom(ADMIN, { identity: SENDER }));
        const { receive } = renderReceiver(decryptMessage, store);

        receive(ADMIN, PublishableDataTypes.LowerHandAdmin, `${SENDER}-1`);
        await flushAsyncWork();

        await act(async () => {
            store.dispatch(
                mergeParticipantsMap({
                    [ADMIN]: {
                        ParticipantUUID: 'admin-uuid',
                        EncryptedDisplayName: '',
                        IsAdmin: ParticipantCapabilityPermission.NotAllowed,
                        IsHost: ParticipantCapabilityPermission.NotAllowed,
                    },
                })
            );
        });
        await flushAsyncWork();

        expect(getRaisedHands(store)).toEqual([SENDER]);
    });

    it('re-publishes the raised hand to a newcomer only while the local hand is raised', async () => {
        const store = createStore();
        const { room } = renderReceiver(vi.fn(), store);
        const handleParticipantConnected = getListener(room, 'participantConnected');

        handleParticipantConnected({ identity: NEWCOMER } as Participant);
        await flushAsyncWork();

        expect(room.localParticipant.publishData).not.toHaveBeenCalled();

        store.dispatch(raiseHand(LOCAL));
        handleParticipantConnected({ identity: NEWCOMER } as Participant);
        await flushAsyncWork();

        expect(room.localParticipant.publishData).toHaveBeenCalledTimes(1);
        expect(room.localParticipant.publishData).toHaveBeenCalledWith(expect.any(Uint8Array), {
            topic: PublishableDataTypes.RaiseHand,
            reliable: true,
            destinationIdentities: [NEWCOMER],
        });
    });

    it('re-publishes the raised hand to everyone when the MLS epoch changes, only while the local hand is raised', async () => {
        const store = createStore();
        setEpoch(store, 4);
        const { room, client } = renderReceiver(vi.fn(), store);

        setEpoch(store, 5);
        await flushAsyncWork();

        expect(room.localParticipant.publishData).not.toHaveBeenCalled();

        store.dispatch(raiseHand(LOCAL));
        setEpoch(store, 6);
        await flushAsyncWork();

        expect(client.encryptMessage).toHaveBeenCalledWith(JSON.stringify({ raised: true }));
        expect(room.localParticipant.publishData).toHaveBeenCalledTimes(1);
        expect(room.localParticipant.publishData).toHaveBeenCalledWith(expect.any(Uint8Array), {
            topic: PublishableDataTypes.RaiseHand,
            reliable: true,
            destinationIdentities: undefined,
        });
    });

    it('does not re-publish the raised hand when leaving the meeting clears the MLS epoch', async () => {
        const store = createStore();
        store.dispatch(setJoinedRoom(true));
        store.dispatch(raiseHand(LOCAL));
        setEpoch(store, 4);
        const { room } = renderReceiver(vi.fn(), store);

        store.dispatch(setJoinedRoom(false));
        store.dispatch(resetCurrentMeeting());
        store.dispatch(resetChatAndReactions());
        await flushAsyncWork();

        expect(room.localParticipant.publishData).not.toHaveBeenCalled();
    });

    it('does not re-publish the raised hand when the key poll reports the same epoch again', async () => {
        const store = createStore();
        store.dispatch(raiseHand(LOCAL));
        setEpoch(store, 4);
        const { room } = renderReceiver(vi.fn(), store);

        setEpoch(store, 4);
        await flushAsyncWork();

        expect(room.localParticipant.publishData).not.toHaveBeenCalled();
    });
});
