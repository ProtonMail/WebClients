import { useMemo } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';

const shouldAllowExperimentalActiveSpeakerOrdering = process.env.EXPERIMENTAL_ACTIVE_SPEAKER_ORDERING === 'true';

export const useSortedParticipants = () => {
    const { page, pageSize, selfView } = useMeetContext();

    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();
    const { localParticipant } = useLocalParticipant();
    const localIdentity = localParticipant?.identity;
    const activeIdentities = new Set(activeSpeakers.map((p) => p.identity));

    const sortedParticipants: (RemoteParticipant | LocalParticipant)[] = useMemo(() => {
        const participantsWithDisplayColors = participants.map(
            (participant, index) =>
                ({
                    ...participant,
                    metadata: JSON.stringify({
                        ...JSON.parse(participant.metadata || '{}'),
                        profileColor: `profile-background-${(index % 6) + 1}`,
                        backgroundColor: `meet-background-${(index % 6) + 1}`,
                        borderColor: `tile-border-${(index % 6) + 1}`,
                    }),
                }) as RemoteParticipant | LocalParticipant
        );

        if (!shouldAllowExperimentalActiveSpeakerOrdering) {
            return participantsWithDisplayColors;
        }

        return [...participantsWithDisplayColors].sort((a, b) => {
            const aActive = activeIdentities.has(a.identity);
            const bActive = activeIdentities.has(b.identity);
            if (aActive && !bActive) {
                return -1;
            }
            if (!aActive && bActive) {
                return 1;
            }
            if (a.identity === localIdentity) {
                return -1;
            }
            if (b.identity === localIdentity) {
                return 1;
            }
            return 0;
        });
    }, [participants, activeSpeakers, localIdentity]);

    const filteredParticipants = useMemo(
        () =>
            sortedParticipants.filter((participant) =>
                selfView ? true : participants.length === 1 || participant.identity !== localParticipant.identity
            ),
        [participants, selfView, localParticipant]
    );

    const pagedParticipants = useMemo(() => {
        const start = page * pageSize;
        return filteredParticipants.slice(start, start + pageSize);
    }, [filteredParticipants, page, pageSize]);

    return { sortedParticipants, pagedParticipants, pageCount: Math.ceil(sortedParticipants.length / pageSize) };
};
