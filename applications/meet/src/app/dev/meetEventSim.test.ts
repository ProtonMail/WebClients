import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { ConnectionQuality, ConnectionState, type Room, Track, VideoQuality } from 'livekit-client';
import { EventEmitter } from 'node:events';

import { setIsWebsocketReconnecting } from '@proton/meet/store/slices/connectionSlice';
import { currentMeetingReducer, selectMlsGroupState, setMlsGroupState } from '@proton/meet/store/slices/currentMeeting';
import { participantCountMismatchListener } from '@proton/meet/store/slices/participantCountMismatchListener';
import {
    agentParticipantsReducer,
    setAgentIdentities,
} from '@proton/meet/store/slices/participants/agentParticipantsSlice';
import {
    mergeParticipantsMap,
    participantsReducer,
    setLocalParticipantIdentity,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    setSortedParticipantIdentities,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectParticipantCountMismatch, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetAppStartListening, MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import type { MeetCoreClient } from '../wasm/MeetCoreClient';
import { initMeetEventSim } from './meetEventSim';

const LOCAL_IDENTITY = 'local-participant';

const localParticipant = {
    ParticipantUUID: LOCAL_IDENTITY,
    EncryptedDisplayName: 'encrypted-name',
    IsAdmin: ParticipantCapabilityPermission.Allowed,
    IsHost: ParticipantCapabilityPermission.NotAllowed,
};

const getStateWith = (participantsMap: Record<string, typeof localParticipant>) => () =>
    ({ participants: { localParticipantIdentity: LOCAL_IDENTITY, participantsMap } }) as unknown as MeetState;

const createRoom = (state = ConnectionState.Connected) =>
    ({ state, simulateScenario: vi.fn().mockResolvedValue(undefined) }) as unknown as Room;

const createMeetCoreClient = (getWsState: () => Promise<ConnectionStateInfo>) =>
    ({ getWsState }) as unknown as MeetCoreClient;

const init = (options: Partial<Parameters<typeof initMeetEventSim>[0]>) =>
    initMeetEventSim({
        dispatch: vi.fn(),
        sendMessage: vi.fn(),
        getState: getStateWith({}),
        subscribe: () => () => {},
        room: createRoom(),
        meetCoreClient: createMeetCoreClient(() => Promise.resolve(ConnectionStateInfo.Connected)),
        ...options,
    });

describe('meetEventSim.setLocalParticipantHost', () => {
    let cleanup: () => void;

    afterEach(() => {
        cleanup?.();
    });

    it('marks only the local participant as host and keeps its other fields', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch, getState: getStateWith({ [LOCAL_IDENTITY]: localParticipant }) });

        expect(window.meetEventSim?.setLocalParticipantHost()).toBe(true);
        expect(dispatch).toHaveBeenCalledWith(
            mergeParticipantsMap({
                [LOCAL_IDENTITY]: { ...localParticipant, IsHost: ParticipantCapabilityPermission.Allowed },
            })
        );
    });

    it('removes the host flag when called with false', () => {
        const dispatch = vi.fn();
        const host = { ...localParticipant, IsHost: ParticipantCapabilityPermission.Allowed };
        cleanup = init({ dispatch, getState: getStateWith({ [LOCAL_IDENTITY]: host }) });

        expect(window.meetEventSim?.setLocalParticipantHost(false)).toBe(true);
        expect(dispatch).toHaveBeenCalledWith(
            mergeParticipantsMap({
                [LOCAL_IDENTITY]: { ...host, IsHost: ParticipantCapabilityPermission.NotAllowed },
            })
        );
    });

    it('does nothing when the local participant is not in the participant list yet', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch, getState: getStateWith({}) });

        expect(window.meetEventSim?.setLocalParticipantHost()).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe('meetEventSim.connection', () => {
    let cleanup: () => void;

    const getConnectionState = () =>
        ({
            connection: {
                joinedRoom: true,
                isReconnecting: true,
                reconnectionFailed: false,
                mlsRetrying: true,
            },
        }) as unknown as MeetState;

    afterEach(() => {
        cleanup?.();
        vi.useRealTimers();
    });

    it('drives the given LiveKit scenario on the room', async () => {
        const room = createRoom();
        cleanup = init({ room });

        await window.meetEventSim?.connection.simulate('signal-reconnect');

        expect(room.simulateScenario).toHaveBeenCalledWith('signal-reconnect');
    });

    it('emits a connection quality change for the local participant', () => {
        const localRoomParticipant = { identity: LOCAL_IDENTITY };
        const room = Object.assign(new EventEmitter(), { localParticipant: localRoomParticipant });
        const handleConnectionQualityChanged = vi.fn();
        room.on('connectionQualityChanged', handleConnectionQualityChanged);
        cleanup = init({ room: room as unknown as Room });

        window.meetEventSim?.connection.quality(ConnectionQuality.Lost);

        expect(handleConnectionQualityChanged).toHaveBeenCalledWith('lost', localRoomParticipant);
    });

    it('reports the store flags, the LiveKit state and the meet-core websocket state by name', async () => {
        cleanup = init({
            getState: getConnectionState,
            room: createRoom(ConnectionState.Reconnecting),
            meetCoreClient: createMeetCoreClient(() => Promise.resolve(ConnectionStateInfo.Reconnecting)),
        });

        await expect(window.meetEventSim?.connection.state()).resolves.toEqual({
            liveKit: 'reconnecting',
            joinedRoom: true,
            isReconnecting: true,
            reconnectionFailed: false,
            mlsRetrying: true,
            meetCoreWebSocket: 'Reconnecting',
        });
    });

    it('reports no answer when meet-core does not reply within 2 seconds', async () => {
        vi.useFakeTimers();
        cleanup = init({
            getState: getConnectionState,
            meetCoreClient: createMeetCoreClient(() => new Promise(() => {})),
        });

        const snapshot = window.meetEventSim?.connection.state();
        await vi.advanceTimersByTimeAsync(2000);

        await expect(snapshot).resolves.toMatchObject({ meetCoreWebSocket: 'no answer' });
    });

    it('reports no answer when meet-core fails to read its websocket state', async () => {
        cleanup = init({
            getState: getConnectionState,
            meetCoreClient: createMeetCoreClient(() => Promise.reject(new Error('meet-core error'))),
        });

        await expect(window.meetEventSim?.connection.state()).resolves.toMatchObject({
            meetCoreWebSocket: 'no answer',
        });
    });
});

describe('meetEventSim participant count mismatch', () => {
    let cleanup: () => void;

    const NOW = new Date('2026-11-20T12:00:00Z').getTime();
    const mlsGroupState = { displayCode: '1234', epoch: 3, memberCount: 2 };

    const createMeetingStore = ({ withMlsGroupState = true, isLocalParticipantHost = false } = {}) => {
        const listenerMiddleware = createListenerMiddleware();
        participantCountMismatchListener(listenerMiddleware.startListening as unknown as MeetAppStartListening);
        const store = configureStore({
            reducer: {
                ...currentMeetingReducer,
                ...sortedParticipantsReducer,
                ...agentParticipantsReducer,
                ...participantsReducer,
                ...uiStateReducer,
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
        });
        store.dispatch(setLocalParticipantIdentity('alice'));
        store.dispatch(
            mergeParticipantsMap({
                alice: {
                    ...localParticipant,
                    ParticipantUUID: 'alice',
                    IsHost: isLocalParticipantHost
                        ? ParticipantCapabilityPermission.Allowed
                        : ParticipantCapabilityPermission.NotAllowed,
                },
            })
        );
        store.dispatch(setSortedParticipantIdentities(['alice', 'bob']));
        if (withMlsGroupState) {
            store.dispatch(setMlsGroupState(mlsGroupState));
        }

        const getState = () => store.getState() as unknown as MeetState;
        cleanup = init({ dispatch: store.dispatch, getState, subscribe: store.subscribe });

        return {
            dispatch: store.dispatch,
            memberCount: () => selectMlsGroupState(getState())?.memberCount,
            mismatch: () => selectParticipantCountMismatch(getState()),
        };
    };

    beforeEach(() => {
        vi.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
        cleanup?.();
        vi.useRealTimers();
    });

    it('adds the hidden people to the connected participants and starts timing the mismatch now', () => {
        const { memberCount, mismatch } = createMeetingStore();

        expect(window.meetEventSim?.setHiddenParticipants(3)).toBe(true);

        expect(memberCount()).toBe(5);
        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });
    });

    it('keeps the hidden people after an MLS refresh with the real member count', () => {
        const { dispatch, memberCount, mismatch } = createMeetingStore();
        window.meetEventSim?.setHiddenParticipants(2);

        vi.advanceTimersByTime(MINUTE);
        dispatch(setMlsGroupState({ ...mlsGroupState, epoch: 4 }));

        expect(memberCount()).toBe(4);
        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });
    });

    it('keeps fewer members than connected participants through an MLS refresh when called with a negative count', () => {
        const { dispatch, memberCount, mismatch } = createMeetingStore();

        expect(window.meetEventSim?.setHiddenParticipants(-1)).toBe(true);

        vi.advanceTimersByTime(MINUTE);
        dispatch(setMlsGroupState({ ...mlsGroupState, epoch: 4 }));

        expect(memberCount()).toBe(1);
        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });
    });

    it('keeps at least one member and no mismatch when a participant leaves after a negative count', () => {
        const { dispatch, memberCount, mismatch } = createMeetingStore();
        window.meetEventSim?.setHiddenParticipants(-1);

        dispatch(setSortedParticipantIdentities(['alice']));

        expect(memberCount()).toBe(1);
        expect(mismatch()).toBeNull();
    });

    it('refuses a negative count that would leave no member', () => {
        const { memberCount, mismatch } = createMeetingStore();

        expect(window.meetEventSim?.setHiddenParticipants(-2)).toBe(false);
        expect(memberCount()).toBe(2);
        expect(mismatch()).toBeNull();
    });

    it('counts a connected agent among the members', () => {
        const { dispatch, memberCount } = createMeetingStore();
        dispatch(setAgentIdentities(['captions-agent']));

        window.meetEventSim?.setHiddenParticipants(2);

        expect(memberCount()).toBe(5);
    });

    it('adds the hidden people to a participant who joins', () => {
        const { dispatch, memberCount } = createMeetingStore();
        window.meetEventSim?.setHiddenParticipants(2);

        dispatch(setSortedParticipantIdentities(['alice', 'bob', 'carol']));

        expect(memberCount()).toBe(5);
    });

    it('matches the member count to the connected participants and stops keeping the hidden people when called with 0', () => {
        const { dispatch, memberCount, mismatch } = createMeetingStore();
        window.meetEventSim?.setHiddenParticipants(2);

        expect(window.meetEventSim?.setHiddenParticipants(0)).toBe(true);
        expect(memberCount()).toBe(2);
        expect(mismatch()).toBeNull();

        dispatch(setSortedParticipantIdentities(['alice', 'bob', 'carol']));
        dispatch(setMlsGroupState({ ...mlsGroupState, memberCount: 3 }));

        expect(memberCount()).toBe(3);
        expect(mismatch()).toBeNull();
    });

    it('stops keeping the hidden people once torn down', () => {
        const { dispatch, memberCount, mismatch } = createMeetingStore();
        window.meetEventSim?.setHiddenParticipants(2);

        cleanup();
        dispatch(setMlsGroupState(mlsGroupState));

        expect(memberCount()).toBe(2);
        expect(mismatch()).toBeNull();
    });

    it('moves the clock of the current mismatch and reports it', () => {
        createMeetingStore({ isLocalParticipantHost: true });
        window.meetEventSim?.setHiddenParticipants(2);

        expect(window.meetEventSim?.setParticipantCountMismatchElapsed(45 * SECOND)).toBe(true);

        expect(window.meetEventSim?.participantCountMismatch()).toEqual({ elapsedMs: 45 * SECOND, isHostInCall: true });
    });

    it('restarts the clock without the host when the local host leaves the host role', () => {
        createMeetingStore({ isLocalParticipantHost: true });
        window.meetEventSim?.setHiddenParticipants(2);
        window.meetEventSim?.setParticipantCountMismatchElapsed(MINUTE);

        window.meetEventSim?.setLocalParticipantHost(false);

        expect(window.meetEventSim?.participantCountMismatch()).toEqual({ elapsedMs: 0, isHostInCall: false });
    });

    it('restarts the clock when someone joins with the host in the call', () => {
        const { dispatch } = createMeetingStore({ isLocalParticipantHost: true });
        window.meetEventSim?.setHiddenParticipants(1);
        window.meetEventSim?.setParticipantCountMismatchElapsed(MINUTE);

        dispatch(setSortedParticipantIdentities(['alice', 'bob', 'carol']));

        expect(window.meetEventSim?.participantCountMismatch()).toEqual({ elapsedMs: 0, isHostInCall: true });
    });

    it('keeps the clock when someone joins without the host in the call', () => {
        const { dispatch } = createMeetingStore();
        window.meetEventSim?.setHiddenParticipants(1);
        window.meetEventSim?.setParticipantCountMismatchElapsed(MINUTE);

        dispatch(setSortedParticipantIdentities(['alice', 'bob', 'carol']));

        expect(window.meetEventSim?.participantCountMismatch()).toEqual({ elapsedMs: MINUTE, isHostInCall: false });
    });

    it('has no mismatch clock to move or report while the counts match', () => {
        createMeetingStore();

        expect(window.meetEventSim?.setParticipantCountMismatchElapsed(MINUTE)).toBe(false);
        expect(window.meetEventSim?.participantCountMismatch()).toBeNull();
    });

    it('does nothing before the MLS group state is known', () => {
        const { memberCount, mismatch } = createMeetingStore({ withMlsGroupState: false });

        expect(window.meetEventSim?.setHiddenParticipants(1)).toBe(false);
        expect(memberCount()).toBeUndefined();
        expect(mismatch()).toBeNull();
    });
});

describe('meetEventSim.cpuLoad', () => {
    let cleanup: () => void;

    afterEach(() => {
        cleanup?.();
    });

    const cameraOf = (publication: object | undefined) => ({
        getTrackPublication: (source: string) => (source === Track.Source.Camera ? publication : undefined),
    });

    it('reports the drops in effect and what each one acts on', async () => {
        const camera = {
            sender: {
                getParameters: () => ({
                    encodings: [
                        { rid: '', active: true },
                        { rid: 'h', active: true },
                        { rid: 'f', active: false },
                    ],
                }),
            },
            getProcessor: () => ({ getSegmentationModel: () => 'selfie_segmenter.tflite' }),
        };
        const room = {
            state: ConnectionState.Connected,
            localParticipant: cameraOf({ videoTrack: camera }),
            remoteParticipants: new Map([
                ['a', cameraOf({ isSubscribed: true, videoQuality: VideoQuality.MEDIUM })],
                ['b', cameraOf({ isSubscribed: false, videoQuality: VideoQuality.HIGH })],
                ['c', cameraOf(undefined)],
            ]),
        };
        cleanup = init({
            room: room as unknown as Room,
            getState: () => ({ cpuLoad: { dropCount: 3 } }) as unknown as MeetState,
        });

        await expect(window.meetEventSim?.cpuLoad()).resolves.toEqual({
            drops: 3,
            incomingVideoQualities: [VideoQuality.MEDIUM],
            publishedLayers: [
                { rid: 'q', active: true },
                { rid: 'h', active: true },
                { rid: 'f', active: false },
            ],
            backgroundModel: 'selfie_segmenter.tflite',
        });
    });

    it('reports no layers and no model without a camera', async () => {
        const room = {
            state: ConnectionState.Connected,
            localParticipant: cameraOf(undefined),
            remoteParticipants: new Map(),
        };
        cleanup = init({
            room: room as unknown as Room,
            getState: () => ({ cpuLoad: { dropCount: 0 } }) as unknown as MeetState,
        });

        await expect(window.meetEventSim?.cpuLoad()).resolves.toEqual({
            drops: 0,
            incomingVideoQualities: [],
            publishedLayers: [],
            backgroundModel: null,
        });
    });
});

describe('meetEventSim.setWebsocketReconnecting', () => {
    let cleanup: () => void;

    afterEach(() => {
        cleanup?.();
    });

    it('marks the meeting server as reconnecting by default', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch });

        window.meetEventSim?.setWebsocketReconnecting();

        expect(dispatch).toHaveBeenCalledWith(setIsWebsocketReconnecting(true));
    });

    it('marks the meeting server as connected again when called with false', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch });

        window.meetEventSim?.setWebsocketReconnecting(false);

        expect(dispatch).toHaveBeenCalledWith(setIsWebsocketReconnecting(false));
    });
});
