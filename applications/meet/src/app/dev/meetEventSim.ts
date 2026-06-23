import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import {
    addChatMessages,
    addEvent,
    raiseHand,
    setActiveReaction,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { mergeParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import { addParticipantRecording, removeParticipantRecording } from '@proton/meet/store/slices/recordingStatusSlice';
import { ParticipantEvent } from '@proton/meet/types/types';

export interface MeetEventSim {
    participantJoined(name?: string): void;
    participantLeft(name?: string): void;
    raiseHand(name?: string): void;
    reaction(emoji?: string, name?: string): void;
    recordingStarted(): void;
    recordingStopped(): void;
    chatMessage(name?: string): void;
    sendChatMessage(message?: string): Promise<boolean>;
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
 * Wires up the `window.meetEventSim` tool with a Redux dispatch function and a
 * `sendMessage` function used to actually publish a chat message to the room.
 * Returns a cleanup function that removes the tool from the window.
 */
export const initMeetEventSim = (
    dispatch: Dispatch<UnknownAction>,
    sendMessage: (content: string) => Promise<boolean>
): (() => void) => {
    const sim: MeetEventSim = {
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

        chatMessage(name = 'Simulated User') {
            const identity = nextIdentity();
            dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
            dispatch(
                addChatMessages([
                    {
                        id: `sim-msg-${Date.now()}`,
                        identity,
                        message: 'Simulated message',
                        timestamp: Date.now(),
                        type: 'message',
                    },
                ])
            );
        },

        sendChatMessage(message = 'Simulated message') {
            return sendMessage(message);
        },
    };

    window.meetEventSim = sim;

    return () => {
        delete window.meetEventSim;
    };
};
