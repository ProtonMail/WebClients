import { createContext, useContext, useMemo } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPage, selectPageSize } from '@proton/meet/store/slices/meetingState';

import { useSortedParticipants } from './useSortedParticipants';

interface SortedParticipantsContextValues {
    sortedParticipants: (LocalParticipant | RemoteParticipant)[];
    sortedParticipantsDisplayColorsMap: Map<
        string,
        { profileTextColor: string; profileColor: string; backgroundColor: string; borderColor: string }
    >;
    pagedParticipants: (LocalParticipant | RemoteParticipant)[];
    pagedParticipantsWithoutSelfView: (LocalParticipant | RemoteParticipant)[];
    pageCount: number;
    pageCountWithoutSelfView: number;
}

export const SortedParticipantsContext = createContext<SortedParticipantsContextValues>({
    sortedParticipants: [],
    sortedParticipantsDisplayColorsMap: new Map(),
    pagedParticipants: [],
    pagedParticipantsWithoutSelfView: [],
    pageCount: 0,
    pageCountWithoutSelfView: 0,
});

export const SortedParticipantsProvider = ({ children }: { children: React.ReactNode }) => {
    const room = useRoomContext();

    const { sortedParticipants, sortedParticipantsDisplayColorsMap } = useSortedParticipants();

    const page = useMeetSelector(selectPage);
    const pageSize = useMeetSelector(selectPageSize);

    // Calculate pagination
    const start = page * pageSize;
    const pagedParticipants = useMemo(
        () => sortedParticipants.slice(start, start + pageSize),
        [sortedParticipants, start, pageSize]
    );

    const pagedParticipantsWithoutSelfView = useMemo(
        () =>
            sortedParticipants.length === 1
                ? sortedParticipants
                : sortedParticipants
                      .filter((p) => p.identity !== room.localParticipant.identity)
                      .slice(start, start + pageSize),
        [sortedParticipants, start, pageSize]
    );

    const pageCount = Math.ceil(sortedParticipants.length / pageSize);

    const pageCountWithoutSelfView = Math.max(1, Math.ceil((sortedParticipants.length - 1) / pageSize));

    const value = useMemo(
        () => ({
            sortedParticipants,
            sortedParticipantsDisplayColorsMap,
            pagedParticipants,
            pagedParticipantsWithoutSelfView,
            pageCount,
            pageCountWithoutSelfView,
        }),
        [
            sortedParticipants,
            sortedParticipantsDisplayColorsMap,
            pagedParticipants,
            pagedParticipantsWithoutSelfView,
            pageCount,
            pageCountWithoutSelfView,
        ]
    );

    return <SortedParticipantsContext.Provider value={value}>{children}</SortedParticipantsContext.Provider>;
};

export const useSortedParticipantsContext = () => {
    return useContext(SortedParticipantsContext);
};
