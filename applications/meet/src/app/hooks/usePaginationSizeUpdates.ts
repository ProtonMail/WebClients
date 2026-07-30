import { useEffect } from 'react';

import { SCREEN_SHARE_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectPage,
    selectPageCount,
    setPage,
    setPageSize,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';

export const usePaginationSizeUpdates = () => {
    const dispatch = useMeetDispatch();
    const page = useMeetSelector(selectPage);
    const pageCount = useMeetSelector(selectPageCount);

    const isScreenShare = useMeetSelector(selectIsScreenShare);

    useEffect(() => {
        if (pageCount - 1 < page) {
            dispatch(setPage(Math.max(0, pageCount - 1)));
        }
    }, [dispatch, pageCount, page]);

    // The grid page size is owned by ParticipantGrid (useFittingPageSize); only screen share overrides it.
    useEffect(() => {
        if (isScreenShare) {
            dispatch(setPageSize(SCREEN_SHARE_PAGE_SIZE));
        }
    }, [dispatch, isScreenShare]);
};
