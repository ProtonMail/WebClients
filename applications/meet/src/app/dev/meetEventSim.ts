import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import {
    type ConnectionQuality,
    type ConnectionState,
    type Room,
    RoomEvent,
    type SimulationScenario,
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
} from '@proton/meet/store/slices/connectionSlice';
import {
    mergeParticipantDecryptedNameMap,
    mergeParticipantsMap,
    selectLocalParticipantIdentity,
    selectParticipantsMap,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { addParticipantRecording, removeParticipantRecording } from '@proton/meet/store/slices/recordingStatusSlice';
import type { MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission, ParticipantEvent } from '@proton/meet/types/types';
import { SECOND } from '@proton/shared/lib/constants';

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

interface MeetEventSim {
    captions: CaptionsSim;
    connection: MeetEventSimConnection;
    participantJoined(name?: string): void;
    participantLeft(name?: string): void;
    raiseHand(name?: string): void;
    reaction(emoji?: string, name?: string): void;
    recordingStarted(): void;
    recordingStopped(): void;
    chatMessage(name?: string, message?: string): void;
    sendChatMessage(message?: string): Promise<boolean>;
    setLocalParticipantHost(isHost?: boolean): boolean;
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
    room: Room;
    meetCoreClient: MeetCoreClient;
}

export const initMeetEventSim = ({
    dispatch,
    sendMessage,
    getState,
    room,
    meetCoreClient,
}: MeetEventSimOptions): (() => void) => {
    const captions = createCaptionsSim(dispatch);

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
    };

    window.meetEventSim = sim;

    return () => {
        captions.stop();
        delete window.meetEventSim;
    };
};
