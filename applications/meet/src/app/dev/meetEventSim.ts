import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import {
    addChatMessages,
    addEvent,
    raiseHand,
    setActiveReaction,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    mergeParticipantDecryptedNameMap,
    mergeParticipantsMap,
    selectLocalParticipantIdentity,
    selectParticipantsMap,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { addParticipantRecording, removeParticipantRecording } from '@proton/meet/store/slices/recordingStatusSlice';
import type { MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission, ParticipantEvent } from '@proton/meet/types/types';

import type { CaptionsSim } from './captionsSim';
import { createCaptionsSim } from './captionsSim';

interface MeetEventSim {
    captions: CaptionsSim;
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

let counter = 0;
const nextIdentity = () => `${SIM_IDENTITY_PREFIX}${++counter}`;

/**
 * Wires up the `window.meetEventSim` tool with a Redux dispatch function, a
 * `sendMessage` function used to actually publish a chat message to the room,
 * and the store's `getState` for the simulations that read the current state.
 * Returns a cleanup function that removes the tool from the window.
 */
export const initMeetEventSim = (
    dispatch: Dispatch<UnknownAction>,
    sendMessage: (content: string) => Promise<boolean>,
    getState: () => MeetState
): (() => void) => {
    const captions = createCaptionsSim(dispatch);

    const sim: MeetEventSim = {
        captions,

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
