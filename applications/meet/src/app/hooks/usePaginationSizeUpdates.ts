import { useEffect } from 'react';

import { PARTICIPANTS_SIDE_BAR_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsSpotlightLayout, selectShowsScreenShareInSidebar } from '@proton/meet/store/slices/layoutSlice';
import {
    selectPage,
    selectPageCount,
    selectSidebarPageCount,
    setPage,
    setPageSize,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';

export const usePaginationSizeUpdates = () => {
    const dispatch = useMeetDispatch();
    const page = useMeetSelector(selectPage);
    const gridPageCount = useMeetSelector(selectPageCount);
    const sidebarPageCount = useMeetSelector(selectSidebarPageCount);

    const isSpotlightLayout = useMeetSelector(selectIsSpotlightLayout);
    const showsScreenShareInSidebar = useMeetSelector(selectShowsScreenShareInSidebar);

    // Both containers share `page`, so the clamp has to follow whichever one is on screen
    const pageCount = isSpotlightLayout ? sidebarPageCount : gridPageCount;

    useEffect(() => {
        if (pageCount - 1 < page) {
            dispatch(setPage(Math.max(0, pageCount - 1)));
        }
    }, [dispatch, pageCount, page]);

    // The grid page size is owned by ParticipantGridLayout (useFittingPageSize); the spotlight sidebar
    // has a fixed number of slots, so it is the only layout that overrides it.
    useEffect(() => {
        if (isSpotlightLayout) {
            dispatch(setPageSize(PARTICIPANTS_SIDE_BAR_PAGE_SIZE - (showsScreenShareInSidebar ? 1 : 0)));
        }
    }, [dispatch, isSpotlightLayout, showsScreenShareInSidebar]);
};
