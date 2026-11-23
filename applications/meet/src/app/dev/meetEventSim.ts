import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import {
    type ConnectionQuality,
    type ConnectionState,
    type Room,
    RoomEvent,
    type SimulationScenario,
    Track,
    type VideoQuality,
} from 'livekit-client';

import {
    addChatMessages,
    addEvent,
    raiseHand,
    setActiveReaction,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    selectIsReconnecting,
    selectJoinedRoom,
    selectMlsRetrying,
    selectReconnectionFailed,
    setIsWebsocketReconnecting,
} from '@proton/meet/store/slices/connectionSlice';
import { selectCpuLoadDropCount } from '@proton/meet/store/slices/cpuLoadSlice';
import { selectMlsGroupState, setMlsGroupState } from '@proton/meet/store/slices/currentMeeting';
import { selectConnectedMemberCount } from '@proton/meet/store/slices/participantCountMismatchListener';
import {
    mergeParticipantDecryptedNameMap,
    mergeParticipantsMap,
    selectLocalParticipantIdentity,
    selectParticipantsMap,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { addParticipantRecording, removeParticipantRecording } from '@proton/meet/store/slices/recordingStatusSlice';
import { selectParticipantCountMismatch, setParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission, ParticipantEvent } from '@proton/meet/types/types';
import { SECOND } from '@proton/shared/lib/constants';

import type { BackgroundProcessor } from '../processors/background-processor/types';
import type { MeetCoreClient } from '../wasm/MeetCoreClient';
import type { CaptionsSim } from './captionsSim';
import { createCaptionsSim } from './captionsSim';

type MeetCoreWebSocketState = keyof typeof ConnectionStateInfo | 'no answer';

interface ConnectionSnapshot {
    liveKit: ConnectionState;
    joinedRoom: boolean;
    isReconnecting: boolean;
    reconnectionFailed: boolean;
    mlsRetrying: boolean;
    meetCoreWebSocket: MeetCoreWebSocketState;
}

interface MeetEventSimConnection {
    simulate(scenario: SimulationScenario): Promise<void>;
    state(): Promise<ConnectionSnapshot>;
    quality(quality: ConnectionQuality): void;
}

interface CpuLoadSnapshot {
    drops: number;
    incomingVideoQualities: VideoQuality[];
    publishedLayers: { rid: string; active: boolean }[];
    backgroundModel: string | null;
}

interface MeetEventSim {
    captions: CaptionsSim;
    connection: MeetEventSimConnection;
    cpuLoad(): Promise<CpuLoadSnapshot>;
    participantJoined(name?: string): void;
    participantLeft(name?: string): void;
    raiseHand(name?: string): void;
    reaction(emoji?: string, name?: string): void;
    recordingStarted(): void;
    recordingStopped(): void;
    chatMessage(name?: string, message?: string): void;
    sendChatMessage(message?: string): Promise<boolean>;
    setLocalParticipantHost(isHost?: boolean): boolean;
    setWebsocketReconnecting(isReconnecting?: boolean): void;
    setHiddenParticipants(count: number): boolean;
    setParticipantCountMismatchElapsed(milliseconds: number): boolean;
    participantCountMismatch(): { elapsedMs: number; isHostInCall: boolean } | null;
}

declare global {
    interface Window {
        meetEventSim?: MeetEventSim;
    }
}

const SIM_IDENTITY_PREFIX = '__event_sim__';
const SIM_RECORDING_IDENTITY = `${SIM_IDENTITY_PREFIX}recording`;

const MEET_CORE_STATE_TIMEOUT_MS = 2 * SECOND;

let counter = 0;
const nextIdentity = () => `${SIM_IDENTITY_PREFIX}${++counter}`;

const getMeetCoreWebSocketState = async (meetCoreClient: MeetCoreClient): Promise<MeetCoreWebSocketState> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<MeetCoreWebSocketState>((resolve) => {
        timeoutId = setTimeout(() => resolve('no answer'), MEET_CORE_STATE_TIMEOUT_MS);
    });
    const stateName = meetCoreClient
        .getWsState()
        .then((state) => ConnectionStateInfo[state] as keyof typeof ConnectionStateInfo);

    try {
        return await Promise.race([stateName, timeout]);
    } catch {
        return 'no answer';
    } finally {
        clearTimeout(timeoutId);
    }
};

interface MeetEventSimOptions {
    dispatch: Dispatch<UnknownAction>;
    sendMessage: (content: string) => Promise<boolean>;
    getState: () => MeetState;
    subscribe: (listener: () => void) => () => void;
    room: Room;
    meetCoreClient: MeetCoreClient;
}

export const initMeetEventSim = ({
    dispatch,
    sendMessage,
    getState,
    subscribe,
    room,
    meetCoreClient,
}: MeetEventSimOptions): (() => void) => {
    const captions = createCaptionsSim(dispatch);

    const keepHiddenParticipants = (count: number) => {
        const getKeptMemberCount = (state: MeetState) => Math.max(selectConnectedMemberCount(state) + count, 1);

        const keepMemberCount = () => {
            const state = getState();
            const mlsGroupState = selectMlsGroupState(state);
            const memberCount = getKeptMemberCount(state);
            if (!mlsGroupState || mlsGroupState.memberCount === memberCount) {
                return;
            }
            const mismatch = selectParticipantCountMismatch(state);
            dispatch(setMlsGroupState({ ...mlsGroupState, memberCount }));
            // A refresh with the real member count briefly matches the counts, which restarts the clock of the kept mismatch.
            if (mismatch && selectParticipantCountMismatch(getState()) !== mismatch) {
                dispatch(setParticipantCountMismatch(mismatch));
            }
        };

        keepMemberCount();
        return subscribe(keepMemberCount);
    };

    let stopKeepingHiddenParticipants = () => {};

    const sim: MeetEventSim = {
        captions,

        connection: {
            simulate(scenario) {
                return room.simulateScenario(scenario);
            },

            async state() {
                const meetCoreWebSocket = await getMeetCoreWebSocketState(meetCoreClient);
                const state = getState();
                return {
                    liveKit: room.state,
                    joinedRoom: selectJoinedRoom(state),
                    isReconnecting: selectIsReconnecting(state),
                    reconnectionFailed: selectReconnectionFailed(state),
                    mlsRetrying: selectMlsRetrying(state),
                    meetCoreWebSocket,
                };
            },

            quality(quality) {
                room.emit(RoomEvent.ConnectionQualityChanged, quality, room.localParticipant);
            },
        },

        async cpuLoad() {
            const camera = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
            const processor = camera?.getProcessor();
            const incomingVideoQualities = [...room.remoteParticipants.values()]
                .map((participant) => participant.getTrackPublication(Track.Source.Camera))
                .filter((publication) => publication?.isSubscribed)
                .map((publication) => publication?.videoQuality)
                .filter((quality) => quality !== undefined);

            return {
                drops: selectCpuLoadDropCount(getState()),
                incomingVideoQualities,
                publishedLayers: (camera?.sender?.getParameters().encodings ?? []).map((encoding) => ({
                    rid: encoding.rid || 'q',
                    active: encoding.active ?? true,
                })),
                backgroundModel:
                    processor && 'getSegmentationModel' in processor
                        ? (processor as BackgroundProcessor).getSegmentationModel()
                        : null,
            };
        },

        participantJoined(name = 'Simulated User') {
            const identity = nextIdentity();
            dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
            dispatch(addEvent([{ identity, eventType: ParticipantEvent.Join, timestamp: Date.now() }]));
        },

        participantLeft(name = 'Simulated User') {
            const identity = nextIdentity();
            dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
            dispatch(addEvent([{ identity, eventType: ParticipantEvent.Leave, timestamp: Date.now() }]));
        },

        raiseHand(name = 'Simulated User') {
            // Each call uses a unique identity so the announcement hook detects a new entry.
            const identity = nextIdentity();
            dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
            dispatch(raiseHand(identity));
        },

        reaction(emoji = '👍', name = 'Simulated User') {
            const identity = nextIdentity();
            dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
            dispatch(setActiveReaction({ identity, emoji, timestamp: Date.now() }));
        },

        recordingStarted() {
            dispatch(addParticipantRecording(SIM_RECORDING_IDENTITY));
        },

        recordingStopped() {
            dispatch(removeParticipantRecording(SIM_RECORDING_IDENTITY));
        },

        chatMessage(name = 'Simulated User', message = 'Simulated message') {
            const identity = nextIdentity();
            dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
            dispatch(
                addChatMessages([
                    {
                        id: `sim-msg-${Date.now()}`,
                        identity,
                        message,
                        timestamp: Date.now(),
                        type: 'message',
                    },
                ])
            );
        },

        sendChatMessage(message = 'Simulated message') {
            return sendMessage(message);
        },

        // Only overrides the local entry in the store: the next participant list fetch restores the server value.
        setLocalParticipantHost(isHost = true) {
            const state = getState();
            const identity = selectLocalParticipantIdentity(state);
            const participant = selectParticipantsMap(state)[identity];
            if (!participant) {
                return false;
            }
            dispatch(
                mergeParticipantsMap({
                    [identity]: {
                        ...participant,
                        IsHost: isHost
                            ? ParticipantCapabilityPermission.Allowed
                            : ParticipantCapabilityPermission.NotAllowed,
                    },
                })
            );
            return true;
        },

        // Stays set while the real state is unchanged: the health check only dispatches when the polled state changes.
        setWebsocketReconnecting(isReconnecting = true) {
            dispatch(setIsWebsocketReconnecting(isReconnecting));
        },

        setHiddenParticipants(count) {
            const state = getState();
            const mlsGroupState = selectMlsGroupState(state);
            const connectedMemberCount = selectConnectedMemberCount(state);
            if (!mlsGroupState || connectedMemberCount + count < 1) {
                return false;
            }
            stopKeepingHiddenParticipants();
            if (count !== 0) {
                stopKeepingHiddenParticipants = keepHiddenParticipants(count);
                return true;
            }
            dispatch(setMlsGroupState({ ...mlsGroupState, memberCount: connectedMemberCount }));
            return true;
        },

        // The next timing restart (a join, a leave, the host leaving or rejoining) overrides it.
        setParticipantCountMismatchElapsed(milliseconds) {
            const mismatch = selectParticipantCountMismatch(getState());
            if (!mismatch) {
                return false;
            }
            dispatch(setParticipantCountMismatch({ ...mismatch, since: Date.now() - milliseconds }));
            return true;
        },

        participantCountMismatch() {
            const mismatch = selectParticipantCountMismatch(getState());
            if (!mismatch) {
                return null;
            }
            return { elapsedMs: Date.now() - mismatch.since, isHostInCall: mismatch.isHostInCall };
        },
    };

    window.meetEventSim = sim;

    return () => {
        captions.stop();
        stopKeepingHiddenParticipants();
        delete window.meetEventSim;
    };
};
