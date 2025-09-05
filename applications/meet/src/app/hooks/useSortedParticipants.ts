import { useMemo, useRef } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from '@proton-meet/livekit-client';

import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';

type ParticipantWithMetadata = RemoteParticipant | LocalParticipant;

const getParticipantWithEnhancedMetadata = (participant: RemoteParticipant | LocalParticipant, index: number) =>
    ({
        ...participant,
        metadata: JSON.stringify({
            ...JSON.parse(participant.metadata || '{}'),
            profileTextColor: `profile-color-${(index % 6) + 1}`,
            profileColor: `profile-background-${(index % 6) + 1}`,
            backgroundColor: `meet-background-${(index % 6) + 1}`,
            borderColor: `tile-border-${(index % 6) + 1}`,
        }),
    }) as ParticipantWithMetadata;

export const useSortedParticipants = ({ page, pageSize }: { page: number; pageSize: number }) => {
    const participants = useParticipants();
    const activeSpeakers = useDebouncedActiveSpeakers();
    const { localParticipant } = useLocalParticipant();
    const localIdentity = localParticipant?.identity;

    const prevFirstPageParticipants = useRef<ParticipantWithMetadata[]>([]);

    const { sortedParticipants, pagedParticipants } = useMemo(() => {
        // Add visual metadata to all participants
        const participantsWithColors = participants.map((participant, index) =>
            getParticipantWithEnhancedMetadata(participant, index)
        );

        const activeIdentities = new Set(activeSpeakers.map((p) => p.identity));
        const prevFirstPageIdentities = new Set(prevFirstPageParticipants.current.map((p) => p.identity));

        // Helper functions for categorizing participants
        const isLocal = (p: ParticipantWithMetadata) => p.identity === localIdentity;
        const isCurrentlySpeaking = (p: ParticipantWithMetadata) => activeIdentities.has(p.identity);
        const wasOnPreviousFirstPage = (p: ParticipantWithMetadata) => prevFirstPageIdentities.has(p.identity);
        const stillExists = (identity: string) => participants.some((p) => p.identity === identity);

        // 1. Local participant (always first)
        const localParticipant = participantsWithColors.find(isLocal) as LocalParticipant;

        // 2. New active speakers (speaking now but weren't on first page before)
        const newActiveSpeakers = participantsWithColors.filter(
            (p) => !isLocal(p) && isCurrentlySpeaking(p) && !wasOnPreviousFirstPage(p)
        );

        // 3. Previous first page participants (for stability, excluding those now speaking)
        const stablePreviousFirstPageParticipants = prevFirstPageParticipants.current.filter(
            (p) => !isLocal(p) && stillExists(p.identity)
        );

        // 4. Remaining inactive participants
        const remainingParticipants = participantsWithColors.filter(
            (p) => !isLocal(p) && !isCurrentlySpeaking(p) && !wasOnPreviousFirstPage(p)
        );

        // Combine in priority order
        const sortedResult = [
            localParticipant,
            ...newActiveSpeakers,
            ...stablePreviousFirstPageParticipants,
            ...remainingParticipants,
        ];

        // Calculate pagination
        const start = page * pageSize;
        const firstPage = sortedResult.slice(0, pageSize);
        const currentPageParticipants = sortedResult.slice(start, start + pageSize);

        // Update the reference for next render
        prevFirstPageParticipants.current = firstPage;

        return {
            sortedParticipants: sortedResult,
            pagedParticipants: currentPageParticipants,
        };
    }, [participants, activeSpeakers, localIdentity, page, pageSize]);

    return {
        sortedParticipants,
        pagedParticipants,
        pageCount: Math.ceil(sortedParticipants.length / pageSize),
    };
};
