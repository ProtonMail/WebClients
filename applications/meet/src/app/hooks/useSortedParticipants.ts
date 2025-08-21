import { useMemo, useRef } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from '@proton-meet/livekit-client';

import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';

export const useSortedParticipants = ({ page, pageSize }: { page: number; pageSize: number }) => {
    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();

    const { localParticipant } = useLocalParticipant();
    const localIdentity = localParticipant?.identity;
    const activeIdentities = new Set(activeSpeakers.map((p) => p.identity));

    const prevFirstPageParticipants = useRef<(RemoteParticipant | LocalParticipant)[]>([]);

    const { sortedParticipants, pagedParticipants } = useMemo(() => {
        const participantsWithDisplayColors = participants.map(
            (participant, index) =>
                ({
                    ...participant,
                    metadata: JSON.stringify({
                        ...JSON.parse(participant.metadata || '{}'),
                        profileTextColor: `profile-color-${(index % 6) + 1}`,
                        profileColor: `profile-background-${(index % 6) + 1}`,
                        backgroundColor: `meet-background-${(index % 6) + 1}`,
                        borderColor: `tile-border-${(index % 6) + 1}`,
                    }),
                }) as RemoteParticipant | LocalParticipant
        );

        const start = page * pageSize;

        const local = participants.find((participant) => participant.identity === localIdentity) as LocalParticipant;

        const speakingButNotOnFirstPage = participantsWithDisplayColors.filter(
            (participant) =>
                participant.identity !== localIdentity &&
                activeIdentities.has(participant.identity) &&
                !prevFirstPageParticipants.current.find((p) => p.identity === participant.identity)
        );

        const validPrevFirstPageParticipants = prevFirstPageParticipants.current.filter((p) => {
            return (
                p.identity !== localIdentity &&
                !!participants.find((participant) => p.identity === participant.identity)
            );
        });

        const restOfParticipants = participantsWithDisplayColors.filter(
            (participant) =>
                participant.identity !== localIdentity &&
                !activeIdentities.has(participant.identity) &&
                !prevFirstPageParticipants.current.find((p) => p.identity === participant.identity)
        );

        const sortingResult = [
            local,
            ...speakingButNotOnFirstPage,
            ...validPrevFirstPageParticipants,
            ...restOfParticipants,
        ];

        const firstPage = sortingResult.slice(0, pageSize);
        const pagedParticipants = sortingResult.slice(start, start + pageSize);

        prevFirstPageParticipants.current = firstPage;

        return {
            sortedParticipants: sortingResult,
            pagedParticipants,
        };
    }, [participants, activeSpeakers, localIdentity, localParticipant, page, pageSize]);

    return { sortedParticipants, pagedParticipants, pageCount: Math.ceil(sortedParticipants.length / pageSize) };
};
