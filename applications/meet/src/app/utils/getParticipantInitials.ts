import type { Participant } from 'livekit-client';

export const getParticipantInitials = (participant: Participant) => {
    if (!participant.name) {
        return 'NA';
    }

    const nameParts = participant.name?.split(' ');

    return `${nameParts?.[0]?.charAt(0)?.toLocaleUpperCase()}${nameParts?.[1]?.charAt(0)?.toLocaleUpperCase()}`;
};
