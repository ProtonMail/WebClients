import { useEffect, useRef } from 'react';

import { PAGE_SIZE, SCREEN_SHARE_PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { useCurrentScreenShare } from './useCurrentScreenShare';
import { useIsLargerThanMd } from './useIsLargerThanMd';
import { useIsNarrowHeight } from './useIsNarrowHeight';

export const usePaginationSizeUpdates = () => {
    const { page, setPage, pageSize, setPageSize, sortedParticipants } = useMeetContext();
    const { sideBarState } = useUIStateContext();
    const { videoTrack } = useCurrentScreenShare();

    const hasScreenShare = !!videoTrack;

    const isSideBarOpen = Object.values(sideBarState).some((state) => state);

    const previousHasScreenShareRef = useRef(hasScreenShare);
    const previousPageSizeRef = useRef(pageSize);
    const previousIsSideBarOpenRef = useRef(isSideBarOpen);

    const pageCount = Math.ceil(sortedParticipants.length / pageSize);

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    useEffect(() => {
        if (pageCount - 1 < page) {
            setPage(() => pageCount - 1);
        }
    }, [pageCount, page, setPage]);

    useEffect(() => {
        const sizeBasedPageSize = isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE;

        const newPageSize = hasScreenShare ? SCREEN_SHARE_PAGE_SIZE : sizeBasedPageSize;

        if (previousPageSizeRef.current !== newPageSize) {
            setPageSize(newPageSize);
        }

        if (previousPageSizeRef.current !== newPageSize) {
            setPage(0);
        }

        previousPageSizeRef.current = newPageSize;
        previousHasScreenShareRef.current = hasScreenShare;
        previousIsSideBarOpenRef.current = isSideBarOpen;
    }, [
        hasScreenShare,
        isSideBarOpen,
        setPageSize,
        setPage,
        sortedParticipants.length,
        isLargerThanMd,
        isNarrowHeight,
    ]);
};
