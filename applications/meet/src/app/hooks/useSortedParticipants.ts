import { useCallback, useMemo, useRef } from 'react';

import { useParticipants, useRoomContext } from '@livekit/components-react';
import { type LocalParticipant, type RemoteParticipant, RoomEvent } from 'livekit-client';

import isTruthy from '@proton/utils/isTruthy';

import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';

type ParticipantWithMetadata = RemoteParticipant | LocalParticipant;

const THROTTLE_INTERVAL_MS = 2000;

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

const updateOnlyOn = [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
    RoomEvent.RoomMetadataChanged,
    RoomEvent.ParticipantPermissionsChanged,
    RoomEvent.ParticipantMetadataChanged,
    RoomEvent.ParticipantNameChanged,
    RoomEvent.ParticipantAttributesChanged,
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackSubscriptionFailed,
    RoomEvent.TrackSubscriptionPermissionChanged,
    RoomEvent.TrackSubscriptionStatusChanged,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
];

export const useSortedParticipants = ({ page, pageSize }: { page: number; pageSize: number }) => {
    const room = useRoomContext();

    // Only updating on specific events
    const participants = useParticipants({
        updateOnlyOn,
    });
    const activeSpeakers = useDebouncedActiveSpeakers(THROTTLE_INTERVAL_MS);

    const localParticipant = room.localParticipant;
    const localIdentity = localParticipant?.identity;

    const prevFirstPageParticipants = useRef<ParticipantWithMetadata[]>([]);

    const computeSortedParticipants = useCallback(
        (currentParticipants: typeof participants, currentPage: number, currentPageSize: number) => {
            // Add visual metadata to all participants
            const participantsWithColors = currentParticipants.map((participant, index) =>
                getParticipantWithEnhancedMetadata(participant, index)
            );

            const activeIdentities = new Set(activeSpeakers.map((p) => p.identity));
            const prevFirstPageIdentities = new Set(prevFirstPageParticipants.current.map((p) => p.identity));
            const currentIdentities = new Set(currentParticipants.map((p) => p.identity));

            // Helper functions for categorizing participants
            const isLocal = (p: ParticipantWithMetadata) => p.identity === localIdentity;
            const isCurrentlySpeaking = (p: ParticipantWithMetadata) => activeIdentities.has(p.identity);
            const wasOnPreviousFirstPage = (p: ParticipantWithMetadata) => prevFirstPageIdentities.has(p.identity);
            const stillExists = (identity: string) => currentIdentities.has(identity);

            let localParticipantData: ParticipantWithMetadata | null = null;
            const newActiveSpeakers: ParticipantWithMetadata[] = [];
            const remainingParticipants: ParticipantWithMetadata[] = [];

            participantsWithColors.forEach((participant) => {
                if (isLocal(participant)) {
                    localParticipantData = participant;
                } else if (isCurrentlySpeaking(participant) && !wasOnPreviousFirstPage(participant)) {
                    newActiveSpeakers.push(participant);
                } else if (!wasOnPreviousFirstPage(participant)) {
                    remainingParticipants.push(participant);
                }
            });

            // 3. Previous first page participants (for stability, excluding those now speaking)
            const stablePreviousFirstPageParticipants = prevFirstPageParticipants.current.filter(
                (p) => !isLocal(p) && stillExists(p.identity)
            );

            // Combine in priority order
            const sortedResult = [
                // 1. Local participant (always first)
                localParticipantData,
                // 2. New active speakers (speaking now but weren't on first page before)
                ...newActiveSpeakers,
                // 3. Previous first page participants (for stability, excluding those now speaking)
                ...stablePreviousFirstPageParticipants,
                // 4. Remaining inactive participants
                ...remainingParticipants,
            ].filter(isTruthy);

            // Calculate pagination
            const start = currentPage * currentPageSize;
            const firstPage = sortedResult.slice(0, currentPageSize);
            const currentPageParticipants = sortedResult.slice(start, start + currentPageSize);

            const pagedParticipantsWithoutSelfView =
                currentParticipants.length === 1
                    ? sortedResult
                    : sortedResult.filter((p) => p.identity !== localIdentity).slice(start, start + currentPageSize);

            // Update the reference for next render
            prevFirstPageParticipants.current = firstPage;

            const sortedParticipantsMap = new Map(sortedResult.map((p) => [p.identity, p]));

            return {
                sortedParticipants: sortedResult,
                pagedParticipants: currentPageParticipants,
                pagedParticipantsWithoutSelfView,
                sortedParticipantsMap,
            };
        },
        [activeSpeakers, localIdentity]
    );

    const { sortedParticipants, sortedParticipantsMap, pagedParticipants, pagedParticipantsWithoutSelfView } = useMemo(
        () => computeSortedParticipants(participants, page, pageSize),
        [computeSortedParticipants, participants, page, pageSize]
    );

    return {
        participants,
        sortedParticipants,
        sortedParticipantsMap,
        pagedParticipants,
        pageCount: Math.ceil(sortedParticipants.length / pageSize),
        pagedParticipantsWithoutSelfView,
        pageCountWithoutSelfView: Math.max(1, Math.ceil((sortedParticipants.length - 1) / pageSize)),
    };
};
