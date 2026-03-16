import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

/**
 * We get ideal order of participants without taking into account the previous order
 */
export const getIdealSortedParticipants = (participants: (LocalParticipant | RemoteParticipant)[]): string[] => {
    const local = participants.find((p) => p.isLocal) as LocalParticipant;
    const remotes = participants.filter((p) => !p.isLocal) as RemoteParticipant[];

    remotes.sort((a, b) => {
        // Active speakers first
        if (a.isSpeaking && b.isSpeaking) {
            return b.audioLevel - a.audioLevel;
        }
        if (a.isSpeaking !== b.isSpeaking) {
            return a.isSpeaking ? -1 : 1;
        }

        // Recently spoke
        if (a.lastSpokeAt !== b.lastSpokeAt) {
            return (b.lastSpokeAt?.getTime() ?? 0) - (a.lastSpokeAt?.getTime() ?? 0);
        }

        // Camera ON before camera OFF
        const aCamera = a.isCameraEnabled;
        const bCamera = b.isCameraEnabled;
        if (aCamera !== bCamera) {
            return aCamera ? -1 : 1;
        }

        // By join time
        return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
    });

    return [local, ...remotes].filter(Boolean).map((p) => p.identity);
};
