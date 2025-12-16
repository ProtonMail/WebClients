import type { LocalParticipant } from 'livekit-client';

import type { ParticipantEntity } from '../types';

export const isLocalParticipantAdmin = (
    participantsMap: Record<string, ParticipantEntity>,
    localParticipant: LocalParticipant
) => {
    const localParticipantFromArray = participantsMap[localParticipant?.identity ?? ''];

    const adminLevelUsers = Object.values(participantsMap).filter(
        (participant) => !!participant.IsAdmin || !!participant.IsHost
    );

    const hasAnotherAdmin = adminLevelUsers.length > 1;
    const hostIsPresent = adminLevelUsers.some((participant) => !!participant.IsHost);

    return {
        hasAnotherAdmin,
        hostIsPresent,
        isLocalParticipantHost: !!localParticipantFromArray?.IsHost,
        isLocalParticipantAdmin: !!localParticipantFromArray?.IsAdmin,
    };
};
