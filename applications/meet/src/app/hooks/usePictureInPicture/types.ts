import type { Participant, Track, TrackPublication } from 'livekit-client';

export type PiPOverlayMessageType = 'chatMessage' | 'systemErrorMessage' | 'systemInfoMessage';

export interface PiPOverlayMessage {
    id: string;
    message: string;
    type: PiPOverlayMessageType;
    timestamp: number;
    sender?: string; // Only for chat messages
}

export interface MessageState {
    messages: PiPOverlayMessage[];
    maxMessages: number;
}

export type MessageAction =
    | { type: 'ADD_MESSAGE'; payload: PiPOverlayMessage }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'REMOVE_MESSAGE'; payload: string };

export interface TrackInfo {
    track: Track;
    participant: Participant;
    publication: TrackPublication;
    isScreenShare: boolean;
}
