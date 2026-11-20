import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import { ConnectionQuality, ConnectionState, type Room } from 'livekit-client';
import { EventEmitter } from 'node:events';

import { setIsWebsocketReconnecting } from '@proton/meet/store/slices/connectionSlice';
import { setMlsGroupState } from '@proton/meet/store/slices/currentMeeting';
import { mergeParticipantsMap } from '@proton/meet/store/slices/participants/participantsSlice';
import { setParticipantCountMismatchSince } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';
import { MINUTE } from '@proton/shared/lib/constants';

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

describe('meetEventSim.setHiddenParticipants', () => {
    let cleanup: () => void;

    const NOW = new Date('2026-11-20T12:00:00Z').getTime();
    const mlsGroupState = { displayCode: '1234', epoch: 3, memberCount: 3 };

    const getMeetingState = (groupState: typeof mlsGroupState | null) => () =>
        ({
            currentMeeting: { mlsGroupState: groupState },
            sortedParticipants: { sortedParticipantIdentities: ['alice', 'bob'] },
            agentParticipants: { agentIdentities: ['captions-agent'] },
        }) as unknown as MeetState;

    beforeEach(() => {
        vi.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
        cleanup?.();
        vi.useRealTimers();
    });

    it('starts a mismatch old enough for the warning and adds the hidden people to the connected humans and agents', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch, getState: getMeetingState(mlsGroupState) });

        expect(window.meetEventSim?.setHiddenParticipants(3)).toBe(true);
        expect(dispatch.mock.calls).toEqual([
            [setParticipantCountMismatchSince(NOW - MINUTE)],
            [setMlsGroupState({ ...mlsGroupState, memberCount: 6 })],
        ]);
    });

    it('matches the member count to the connected humans and agents when called with 0', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch, getState: getMeetingState({ ...mlsGroupState, memberCount: 6 }) });

        expect(window.meetEventSim?.setHiddenParticipants(0)).toBe(true);
        expect(dispatch.mock.calls).toEqual([[setMlsGroupState({ ...mlsGroupState, memberCount: 3 })]]);
    });

    it('does nothing before the MLS group state is known', () => {
        const dispatch = vi.fn();
        cleanup = init({ dispatch, getState: getMeetingState(null) });

        expect(window.meetEventSim?.setHiddenParticipants(1)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
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
