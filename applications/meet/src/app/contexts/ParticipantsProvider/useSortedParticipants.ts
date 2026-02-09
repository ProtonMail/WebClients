import { useCallback, useEffect, useMemo, useState } from 'react';

import { useParticipants, useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { type LocalParticipant, type RemoteParticipant, RoomEvent } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPageSize } from '@proton/meet/store/slices/meetingState';
import isTruthy from '@proton/utils/isTruthy';

import { useStableCallback } from '../../hooks/useStableCallback';
import { getParticipantDisplayColorsByIndex } from '../../utils/getParticipantDisplayColorsByIndex';

const updateOnlyOn = [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.Connected,
    RoomEvent.Disconnected,
    RoomEvent.Reconnected,
];

export const useSortedParticipants = () => {
    // Only updating on specific events
    const participants = useParticipants({
        updateOnlyOn,
    });
    const [recentSpeakers, setRecentSpeakers] = useState<RemoteParticipant[]>([]);
    const [recentSpeakersMap, setRecentSpeakersMap] = useState<Map<string, RemoteParticipant>>(new Map());

    const room = useRoomContext();

    const pageSize = useMeetSelector(selectPageSize);

    const handleActiveSpeakersChanged = useStableCallback((currentActiveSpeakers: Participant[]) => {
        const remoteCurrentActiveSpeakers = currentActiveSpeakers.filter(
            (participant) => participant.identity !== room.localParticipant.identity
        ) as RemoteParticipant[];

        const firstPage = [
            room.localParticipant,
            ...recentSpeakers.slice(0, pageSize - 1),
            ...participants.slice(0, pageSize - 1).filter((p) => !recentSpeakersMap.has(p.identity)),
        ].slice(0, pageSize - 1);

        // Should only move forward if the participant is not in the first page
        const shouldMoveForward = remoteCurrentActiveSpeakers.filter(
            (participant) => !firstPage.some((r) => r.identity === participant.identity)
        );

        const updatedRecentSpeakers = [
            ...shouldMoveForward,
            ...recentSpeakers.filter(
                (participant) => !shouldMoveForward.some((r) => r.identity === participant.identity)
            ),
        ];

        if (
            recentSpeakers.length > 0 &&
            recentSpeakers.every((participant, index) => participant.identity === updatedRecentSpeakers[index].identity)
        ) {
            return;
        }

        setRecentSpeakers(updatedRecentSpeakers);
        setRecentSpeakersMap(new Map(updatedRecentSpeakers.map((p) => [p.identity, p])));
    });

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleParticipantDisconnected = (participant: Participant) => {
            setRecentSpeakers((prevRecentSpeakers) =>
                prevRecentSpeakers.filter((r) => r.identity !== participant.identity)
            );
            setRecentSpeakersMap((prevRecentSpeakersMap) => {
                const updatedMap = new Map(prevRecentSpeakersMap);
                updatedMap.delete(participant.identity);
                return updatedMap;
            });
        };

        const handleRoomDisconnected = () => {
            setRecentSpeakers([]);
            setRecentSpeakersMap(new Map());
        };

        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.Disconnected, handleRoomDisconnected);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
            room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
            room.off(RoomEvent.Disconnected, handleRoomDisconnected);
        };
    }, [room, setRecentSpeakers, setRecentSpeakersMap, handleActiveSpeakersChanged]);

    const computeSortedParticipants = useCallback(
        (currentParticipants: (LocalParticipant | RemoteParticipant)[]) => {
            // Combine in priority order
            const sortedResult = [
                room.localParticipant,
                ...recentSpeakers,
                ...currentParticipants.filter(
                    (p) => p.identity !== room.localParticipant.identity && !recentSpeakersMap.has(p.identity)
                ),
            ].filter(isTruthy);

            const sortedParticipantsDisplayColorsMap = new Map(
                sortedResult.map((p, index) => [p.identity, getParticipantDisplayColorsByIndex(index)])
            );

            return {
                sortedParticipants: sortedResult,
                sortedParticipantsDisplayColorsMap,
            };
        },
        [room, recentSpeakers, recentSpeakersMap]
    );

    const { sortedParticipants, sortedParticipantsDisplayColorsMap } = useMemo(
        () => computeSortedParticipants(participants),
        [computeSortedParticipants, participants]
    );

    return {
        participants,
        sortedParticipants,
        sortedParticipantsDisplayColorsMap,
    };
};
