import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import { ConnectionState, type Room } from 'livekit-client';

import { mergeParticipantsMap } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';

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
