import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { useParticipants, useRoomContext } from '@livekit/components-react';
import { type Participant, RoomEvent } from 'livekit-client';

import { useHandler } from '@proton/components/hooks/useHandler';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { setAgentIdentities } from '@proton/meet/store/slices/participants/agentParticipantsSlice';
import { setLocalParticipantIdentity } from '@proton/meet/store/slices/participants/participantsSlice';
import {
    removeSortedParticipant,
    resetSortedParticipants,
    selectPagedIdentities,
    selectSortedParticipantIdentities,
    updateSortedParticipants,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';

import { PARTICIPANT_SET_EVENTS } from '../../constants';

// `isAgent` derives from `permissions.agent`, so the agents split can change without anyone joining.
const updateOnlyOn = [
    ...PARTICIPANT_SET_EVENTS,
    RoomEvent.Disconnected,
    RoomEvent.ParticipantPermissionsChanged,
    RoomEvent.ParticipantMetadataChanged,
    RoomEvent.ParticipantNameChanged,
];

const ParticipantsMapContext = createContext<Map<string, Participant>>(new Map());

export const SortedParticipantsProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();
    const allParticipants = useParticipants({
        updateOnlyOn,
    });
    const { humans: participants, agents } = useMemo(() => {
        const humans: Participant[] = [];
        const agents: string[] = [];
        for (const p of allParticipants) {
            if (p.isAgent) {
                agents.push(p.identity);
            } else {
                humans.push(p);
            }
        }
        return { humans, agents };
    }, [allParticipants]);
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
        (participant: Participant) => {
            dispatch(removeSortedParticipant(participant.identity));
        },
        [dispatch]
    );

    const handleDisconnected = useCallback(() => {
        dispatch(resetSortedParticipants());
    }, [dispatch]);

    const handleConnected = useCallback(() => {
        // Set local participant identity as soon as is connected to the room
        dispatch(setLocalParticipantIdentity(room.localParticipant.identity));
    }, [dispatch, room.localParticipant.identity]);

    const raisedHands = useMeetSelector(selectRaisedHands);

    useEffect(() => {
        dispatch(setAgentIdentities(agents));
    }, [agents, dispatch]);

    useEffect(() => {
        throttledUpdateSortedParticipants();
    }, [
        participants,
        throttledUpdateSortedParticipants,
        // We want to update sorted participants when a participant raises or lowers their hand
        raisedHands,
    ]);

    useEffect(() => {
        room.on(RoomEvent.ActiveSpeakersChanged, throttledUpdateSortedParticipants);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);
        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Reconnected, handleConnected);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, throttledUpdateSortedParticipants);
            room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
            room.off(RoomEvent.Disconnected, handleDisconnected);
            room.off(RoomEvent.Connected, handleConnected);
            room.off(RoomEvent.Reconnected, handleConnected);
        };
    }, [throttledUpdateSortedParticipants, handleConnected, handleDisconnected, handleParticipantDisconnected, room]);

    return (
        <ParticipantsMapContext.Provider value={participantsMap}>{children}</ParticipantsMapContext.Provider>
    );
};

export const useParticipantsMapContext = () => {
    return useContext(ParticipantsMapContext);
};

export const useSortedParticipants = () => {
    const sortedParticipantIdentities = useMeetSelector(selectSortedParticipantIdentities);
    const participantsMap = useParticipantsMapContext();

    return useMemo(
        () =>
            sortedParticipantIdentities.map((identity) => participantsMap.get(identity) as Participant).filter(Boolean),
        [sortedParticipantIdentities, participantsMap]
    );
};

export const useSortedPagedParticipants = () => {
    const sortedPagedParticipantIdentities = useMeetSelector(selectPagedIdentities);
    const participantsMap = useParticipantsMapContext();

    return useMemo(
        () =>
            sortedPagedParticipantIdentities
                .map((identity) => participantsMap.get(identity) as Participant)
                .filter(Boolean),
        [sortedPagedParticipantIdentities, participantsMap]
    );
};
