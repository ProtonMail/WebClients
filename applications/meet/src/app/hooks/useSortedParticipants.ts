import { useMemo } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';

import { PAGE_SIZE } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';
import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';

const shouldAllowExperimentalActiveSpeakerOrdering = process.env.EXPERIMENTAL_ACTIVE_SPEAKER_ORDERING === 'true';

export const useSortedParticipants = () => {
    const { page } = useMeetContext();

    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();
    const { localParticipant } = useLocalParticipant();
    const localIdentity = localParticipant?.identity;
    const activeIdentities = new Set(activeSpeakers.map((p) => p.identity));

    const sortedParticipants = useMemo(() => {
        if (!shouldAllowExperimentalActiveSpeakerOrdering) {
            return participants;
        }

        return [...participants].sort((a, b) => {
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

    const pagedParticipants = useMemo(() => {
        const start = page * PAGE_SIZE;
        return sortedParticipants.slice(start, start + PAGE_SIZE);
    }, [sortedParticipants, page]);

    return { sortedParticipants, pagedParticipants, pageCount: Math.ceil(sortedParticipants.length / PAGE_SIZE) };
};
