import { useEffect, useRef } from 'react';

import { PAGE_SIZE, SCREEN_SHARE_DOUBLE_PAGE_SIZE, SCREEN_SHARE_PAGE_SIZE } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { useCurrentScreenShare } from './useCurrentScreenShare';
import { useSortedParticipants } from './useSortedParticipants';

export const usePaginationSizeUpdates = () => {
    const { page, setPage, pageSize, setPageSize } = useMeetContext();
    const { sideBarState } = useUIStateContext();
    const { videoTrack } = useCurrentScreenShare();

    const { sortedParticipants } = useSortedParticipants();

    const hasScreenShare = !!videoTrack;

    const isSideBarOpen = Object.values(sideBarState).some((state) => state);

    const previousHasScreenShareRef = useRef(hasScreenShare);
    const previousPageSizeRef = useRef(pageSize);
    const previousIsSideBarOpenRef = useRef(isSideBarOpen);

    const pageCount = Math.ceil(sortedParticipants.length / pageSize);

    useEffect(() => {
        if (pageCount - 1 < page) {
            setPage(() => pageCount - 1);
        }
    }, [pageCount, page, setPage]);

    useEffect(() => {
        const screenShareSize =
            sortedParticipants.length > 5 && !isSideBarOpen ? SCREEN_SHARE_DOUBLE_PAGE_SIZE : SCREEN_SHARE_PAGE_SIZE;

        const newPageSize = hasScreenShare ? screenShareSize : PAGE_SIZE;

        if (previousPageSizeRef.current !== newPageSize) {
            setPageSize(newPageSize);
        }

        if (previousPageSizeRef.current !== newPageSize) {
            setPage(() => 0);
        }

        previousPageSizeRef.current = newPageSize;
        previousHasScreenShareRef.current = hasScreenShare;
        previousIsSideBarOpenRef.current = isSideBarOpen;
    }, [hasScreenShare, isSideBarOpen, setPageSize, setPage]);
};
