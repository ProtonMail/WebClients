import { RoomEvent } from 'livekit-client';

export const JOIN_TITLE_TIMEOUT = 2000;

export const NOTIFICATION_PARTICIPANT_LIMIT = 10;

export const MEETING_LOCKED_ERROR_CODE = 2502;

export const PIP_PREVIEW_ITEM_WIDTH = 480;
export const PIP_PREVIEW_ITEM_HEIGHT = 270;

export const JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT = 5;

export const REACTION_DISPLAY_DURATION_MS = 3_000;

export const RAISE_HAND_EMOJI = '✋';

export const PARTICIPANT_SET_EVENTS = [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.Connected,
    RoomEvent.Reconnected,
];

// Captions agent lifecycle timings.
// How long the driver keeps trying to summon the agent. Shared with the give-up timeout, so the
// attempts and the local preference stop at the same time.
export const CAPTIONS_AGENT_WAIT_MS = 30_000;
export const CAPTIONS_AGENT_RETRY_BACKOFF_MS = 3_000;
export const CAPTIONS_AGENT_DISABLE_GRACE_MS = 10_000;

// Delays before each attempt when summoning or admitting the agent, spanning the wait window.
export const CAPTIONS_AGENT_RETRY_DELAYS_MS = [
    0,
    ...Array<number>(Math.floor(CAPTIONS_AGENT_WAIT_MS / CAPTIONS_AGENT_RETRY_BACKOFF_MS)).fill(
        CAPTIONS_AGENT_RETRY_BACKOFF_MS
    ),
];
