import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { useParticipants, useRoomContext } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

import { useHandler } from '@proton/components/hooks/useHandler';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    removeParticipant,
    resetSortedParticipants,
    selectPagedIdentities,
    selectSortedParticipantIdentities,
    updateSortedParticipants,
} from '@proton/meet/store/slices/sortedParticipantsSlice';

const updateOnlyOn = [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.Connected,
    RoomEvent.Disconnected,
    RoomEvent.Reconnected,
];

const ParticipantsMapContext = createContext<Map<string, LocalParticipant | RemoteParticipant>>(new Map());

export const SortedParticipantsProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();
    const participants = useParticipants({
        updateOnlyOn,
    });
    const participantsMap = useMemo(
        () =>
            new Map(
                participants.filter((p) => p.identity !== '').map((participant) => [participant.identity, participant])
            ),
        [participants]
    );

    const handleUpdateSortedParticipants = useCallback(() => {
        dispatch(updateSortedParticipants(participants));
    }, [participants, dispatch]);

    // We avoid spamming participants sorting updates,
    // specially because is triggered by ActiveSpeakersChanged event
    const throttledUpdateSortedParticipants = useHandler(handleUpdateSortedParticipants, { throttle: 200 });

    const handleParticipantDisconnected = useCallback(
        (participant: LocalParticipant | RemoteParticipant) => {
            dispatch(removeParticipant(participant.identity));
        },
        [dispatch]
    );

    const handleDisconnected = useCallback(() => {
        dispatch(resetSortedParticipants());
    }, [dispatch]);

    const raisedHands = useMeetSelector(selectRaisedHands);

    useEffect(() => {
        throttledUpdateSortedParticipants();
    }, [participants, throttledUpdateSortedParticipants, raisedHands]);

    useEffect(() => {
        room.on(RoomEvent.ActiveSpeakersChanged, throttledUpdateSortedParticipants);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, throttledUpdateSortedParticipants);
            room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [throttledUpdateSortedParticipants, handleDisconnected, handleParticipantDisconnected, room]);

    return <ParticipantsMapContext.Provider value={participantsMap}>{children}</ParticipantsMapContext.Provider>;
};

export const useParticipantsMapContext = () => {
    return useContext(ParticipantsMapContext);
};

export const useSortedParticipants = () => {
    const sortedParticipantIdentities = useMeetSelector(selectSortedParticipantIdentities);
    const participantsMap = useParticipantsMapContext();

    return useMemo(
        () =>
            sortedParticipantIdentities
                .map((identity) => participantsMap.get(identity) as LocalParticipant | RemoteParticipant)
                .filter(Boolean),
        [sortedParticipantIdentities, participantsMap]
    );
};

export const useSortedPagedParticipants = () => {
    const sortedPagedParticipantIdentities = useMeetSelector(selectPagedIdentities);
    const participantsMap = useParticipantsMapContext();

    return useMemo(
        () =>
            sortedPagedParticipantIdentities
                .map((identity) => participantsMap.get(identity) as LocalParticipant | RemoteParticipant)
                .filter(Boolean),
        [sortedPagedParticipantIdentities, participantsMap]
    );
};
