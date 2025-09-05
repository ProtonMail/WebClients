import type { LocalParticipant, Participant, RemoteParticipant } from '@proton-meet/livekit-client';

export const getParticipantDisplayColors = (
    participant: Partial<RemoteParticipant> | Partial<LocalParticipant> | Partial<Participant>
) => {
    const metadata = JSON.parse(participant?.metadata || '{}');

    return {
        profileColor: metadata?.profileColor ?? `profile-background-1`,
        backgroundColor: metadata?.backgroundColor ?? `meet-background-1`,
        borderColor: metadata?.borderColor ?? `tile-border-1`,
        profileTextColor: metadata?.profileTextColor ?? `profile-color-1`,
    };
};
