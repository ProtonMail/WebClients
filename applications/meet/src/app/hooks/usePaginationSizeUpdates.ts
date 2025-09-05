import { useEffect } from 'react';

import { PAGE_SIZE, SCREEN_SHARE_PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { useIsLargerThanMd } from './useIsLargerThanMd';
import { useIsNarrowHeight } from './useIsNarrowHeight';

export const usePaginationSizeUpdates = () => {
    const { page, setPage, pageSize, setPageSize, sortedParticipants } = useMeetContext();
    const { sideBarState } = useUIStateContext();
    const { isScreenShare } = useMeetContext();

    const isSideBarOpen = Object.values(sideBarState).some((state) => state);

    const pageCount = Math.ceil(sortedParticipants.length / pageSize);

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    useEffect(() => {
        if (pageCount - 1 < page) {
            setPage(pageCount - 1);
        }
    }, [pageCount, page, setPage]);

    useEffect(() => {
        const sizeBasedPageSize = isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE;

        const newPageSize = isScreenShare ? SCREEN_SHARE_PAGE_SIZE : sizeBasedPageSize;

        setPageSize(newPageSize);
    }, [isScreenShare, isSideBarOpen, setPageSize, setPage, sortedParticipants.length, isLargerThanMd, isNarrowHeight]);
};
